const validator = require('@app-core/validator');
const { throwAppError } = require('@app-core/errors');
const CreatorCard = require('@app/repository/creator-cards');
const { CreatorCardMessages } = require('@app/messages');

const spec = `root {
  creator_reference string<length:20>
}`;

const parsedSpec = validator.parse(spec);

async function deleteCreatorCard(serviceData) {
  const { slug, ...bodyData } = serviceData;
  const data = validator.validate(bodyData, parsedSpec);
  let result;

  const card = await CreatorCard.findOne({ query: { slug } });

  if (!card || card.deleted) {
    throwAppError(CreatorCardMessages.CARD_NOT_FOUND, 'NF01');
  }

  const now = Date.now();

  await CreatorCard.updateOne({
    query: { _id: card._id },
    updateValues: { deleted: now, updated: now },
  });

  result = {
    id: card._id,
    title: card.title,
    description: card.description,
    slug: card.slug,
    creator_reference: card.creator_reference,
    links: card.links,
    service_rates: card.service_rates,
    status: card.status,
    access_type: card.access_type,
    access_code: card.access_code,
    created: card.created,
    updated: now,
    deleted: now,
  };

  return result;
}

module.exports = deleteCreatorCard;
