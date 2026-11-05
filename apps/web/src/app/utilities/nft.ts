import { getMediaUrl } from "./media";

const getAssetId = (nftsRow) => {
  if (!nftsRow) return null;

  if (nftsRow.contract === "atomicassets") {
    return nftsRow.asset_id;
  } else {
    return nftsRow.assetId;
  }
};

const getType = (nftsRow) => {
  if (!nftsRow) return null;

  if (nftsRow.contract === "atomicassets") {
    return "atomicassets";
  } else {
    return "simpleassets";
  }
};

const getName = (nftsRow) => {
  if (!nftsRow) return null;

  if (nftsRow.contract === "atomicassets") {
    return nftsRow.name;
  } else {
    return nftsRow.idata && nftsRow.idata.name
      ? nftsRow.idata.name
      : nftsRow.mdata.name;
  }
};

const getOwner = (nftsRow) => {
  if (!nftsRow) return null;

  if (nftsRow.contract === "atomicassets") {
    return nftsRow.owner;
  } else {
    return nftsRow.owner;
  }
};

export { getMediaUrl as getURL } from "./media";

const getImage = (nftsRow) => {
  let image = null;

  if (nftsRow.contract === "atomicassets") {
    image = nftsRow.data.img || null;

    if (image) {
      image = getMediaUrl(image);
    }
  } else {
    if (nftsRow.idata && nftsRow.idata.img) {
      image = nftsRow.idata.img;
    } else if (nftsRow.mdata && nftsRow.mdata.img) {
      image = nftsRow.mdata.img;
    }

    if (image) {
      image = getMediaUrl(image);
    }
  }
  return image;
};

const getVideo = (nftsRow) => {
  return nftsRow.contract === "atomicassets"
    ? getMediaUrl(nftsRow.data.video)
    : null;
};

const getCollectionName = (nftsRow) => {
  if (!nftsRow) return null;

  if (nftsRow.contract === "atomicassets") {
    return nftsRow.collection.collection_name;
  } else {
    return nftsRow.category;
  }
};

const getAuthor = (nftsRow) => {
  if (!nftsRow) return null;

  if (nftsRow.contract === "atomicassets") {
    return nftsRow.collection.author;
  } else {
    return nftsRow.author;
  }
};

const getSchemaName = (nftsRow) => {
  if (!nftsRow) return null;

  if (nftsRow.contract === "atomicassets") {
    return nftsRow.schema.schema_name;
  } else {
    return "N/A";
  }
};

const getTemplateId = (nftsRow) => {
  if (!nftsRow) return null;

  if (nftsRow.contract === "atomicassets") {
    return nftsRow.template ? nftsRow.template.template_id : "N/A";
  } else {
    return "N/A";
  }
};

const getMutableData = (nftsRow) => {
  if (!nftsRow) return null;

  if (nftsRow.contract === "atomicassets") {
    if (nftsRow.mutable_data && !isObjectEmpty(nftsRow.mutable_data)) {
      return nftsRow.mutable_data;
    } else if (
      nftsRow.template &&
      nftsRow.template.mutable_data &&
      !isObjectEmpty(nftsRow.template.mutable_data)
    ) {
      return nftsRow.template.mutable_data;
    }
    return null;
  } else {
    return nftsRow.mdata ? nftsRow.mdata : null;
  }
};

const getImmutableData = (nftsRow) => {
  if (!nftsRow) return null;

  if (nftsRow.contract === "atomicassets") {
    if (nftsRow.immutable_data && !isObjectEmpty(nftsRow.immutable_data)) {
      return nftsRow.immutable_data;
    } else if (
      nftsRow.template &&
      nftsRow.template.immutable_data &&
      !isObjectEmpty(nftsRow.template.immutable_data)
    ) {
      return nftsRow.template.immutable_data;
    }
    return null;
  } else {
    return nftsRow.idata ? nftsRow.idata : null;
  }
};

const isTransferable = (nftsRow) => {
  if (!nftsRow) return false;

  if (nftsRow.contract === "atomicassets") {
    return nftsRow.is_transferable;
  } else {
    return false;
  }
};

const isBurnable = (nftsRow) => {
  if (!nftsRow) return false;

  if (nftsRow.contract === "atomicassets") {
    return nftsRow.is_burnable;
  } else {
    return false;
  }
};

const isObjectEmpty = (data) => {
  if (!data || typeof data != "object") return true;

  return Object.keys(data).length === 0;
};

export {
  getAssetId,
  getType,
  getName,
  getOwner,
  getImage,
  getVideo,
  getCollectionName,
  getAuthor,
  getSchemaName,
  getTemplateId,
  getMutableData,
  getImmutableData,
  isTransferable,
  isBurnable,
  isObjectEmpty,
};
