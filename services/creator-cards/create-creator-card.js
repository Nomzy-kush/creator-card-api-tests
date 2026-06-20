const validator = require('@app-core/validator');
const { throwAppError } = require('@app-core/errors');
const { randomBytes } = require('@app-core/randomness');
const CreatorCard = require('@app/repository/creator-cards');
const { CreatorCardMessages } = require('@app/messages');

const spec = `root {
  title string<minLength:3|maxLength:100>
  description? string<maxLength:500>
  slug? string<minLength:5|maxLength:50>
  creator_reference string<length:20>
  links[]? {
    title string<minLength:1|maxLength:100>
    url string<maxLength:200>
  }
  service_rates? {
    currency string(NGN|USD|GBP|GHS)
    rates[] {
      name string<minLength:3|maxLength:100>
      description? string<maxLength:250>
      amount number<min:1>
    }
  }
  status string(draft|published)
  access_type? string(public|private)
  access_code? string<length:6>
}`;

const parsedSpec = validator.parse(spec);

function generateSlugFromTitle(title) {
  let slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-_]/g, '');
  return slug;
}

function generateRandomSuffix() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return suffix;
}

async function createCreatorCard(serviceData) {
  const data = validator.validate(serviceData, parsedSpec);
  let result;

  const accessType = data.access_type || 'public';

  if (accessType === 'private' && !data.access_code) {
    throwAppError(CreatorCardMessages.ACCESS_CODE_REQUIRED, 'AC01');
  }

  if (accessType === 'public' && data.access_code) {
    throwAppError(CreatorCardMessages.ACCESS_CODE_NOT_ALLOWED, 'AC05');
  }

  if (data.access_code && !/^[a-zA-Z0-9]{6}$/.test(data.access_code)) {
    throwAppError('access_code must be exactly 6 alphanumeric characters', 'AC01');
  }

  if (data.links) {
    for (const link of data.links) {
      if (!link.url.startsWith('http://') && !link.url.startsWith('https://')) {
        throwAppError('Link url must start with http:// or https://', 'SPCL_VALIDATION');
      }
    }
  }

  if (data.service_rates && data.service_rates.rates) {
    for (const rate of data.service_rates.rates) {
      if (!Number.isInteger(rate.amount) || rate.amount < 1) {
        throwAppError('Rate amount must be a positive integer', 'SPCL_VALIDATION');
      }
    }
  }

  let slug = data.slug;
  const slugWasProvided = !!slug;

  if (!slug) {
    slug = generateSlugFromTitle(data.title);

    if (slug.length < 5) {
      slug = slug + '-' + generateRandomSuffix();
    }

    const existingCard = await CreatorCard.findOne({ query: { slug } });
    if (existingCard) {
      slug = slug + '-' + generateRandomSuffix();
    }
  } else {
    if (!/^[a-zA-Z0-9\-_]+$/.test(slug)) {
      throwAppError('Slug can only contain letters, numbers, hyphens, and underscores', 'SPCL_VALIDATION');
    }

    const existingCard = await CreatorCard.findOne({ query: { slug } });
    if (existingCard) {
      throwAppError(CreatorCardMessages.SLUG_TAKEN, 'SL02');
    }
  }

  const cardData = {
    title: data.title,
    description: data.description || null,
    slug,
    creator_reference: data.creator_reference,
    links: data.links || [],
    service_rates: data.service_rates || null,
    status: data.status,
    access_type: accessType,
    access_code: accessType === 'private' ? data.access_code : null,
    deleted: null,
  };

  const createdCard = await CreatorCard.create(cardData);

  result = {
    id: createdCard._id,
    title: createdCard.title,
    description: createdCard.description,
    slug: createdCard.slug,
    creator_reference: createdCard.creator_reference,
    links: createdCard.links,
    service_rates: createdCard.service_rates,
    status: createdCard.status,
    access_type: createdCard.access_type,
    access_code: createdCard.access_code,
    created: createdCard.created,
    updated: createdCard.updated,
    deleted: createdCard.deleted,
  };

  return result;
}

module.exports = createCreatorCard;
