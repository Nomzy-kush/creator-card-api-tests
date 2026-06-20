const { throwAppError } = require('@app-core/errors');
const CreatorCard = require('@app/repository/creator-cards');
const { CreatorCardMessages } = require('@app/messages');

async function getCreatorCard(serviceData) {
  const { slug, access_code } = serviceData;
  let result;

  const card = await CreatorCard.findOne({ query: { slug } });

  if (!card || card.deleted) {
    throwAppError(CreatorCardMessages.CARD_NOT_FOUND, 'NF01');
  }

  if (card.status === 'draft') {
    throwAppError(CreatorCardMessages.CARD_NOT_FOUND, 'NF02');
  }

  if (card.access_type === 'private') {
    if (!access_code) {
      throwAppError(CreatorCardMessages.CARD_PRIVATE_ACCESS_REQUIRED, 'AC03');
    }

    if (access_code !== card.access_code) {
      throwAppError(CreatorCardMessages.CARD_INVALID_ACCESS_CODE, 'AC04');
    }
  }

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
    created: card.created,
    updated: card.updated,
    deleted: card.deleted,
  };

  return result;
}

module.exports = getCreatorCard;
