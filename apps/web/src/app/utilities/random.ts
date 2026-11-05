import { convertLetterToNumber } from "./converter";

const randomNoImage = () => {
  const noImages = [
    "no-image-A.png",
    "no-image-B.png",
    "no-image-C.png",
    "no-image-D.png",
  ];
  const randomIndex = Math.floor(Math.random() * noImages.length);

  const noImage = noImages[randomIndex];

  return noImage;
};

const randomNoImageByName = (name) => {
  const noImages = [
    "no-image-A.png",
    "no-image-B.png",
    "no-image-C.png",
    "no-image-D.png",
  ];

  const randomIndex = convertLetterToNumber(name || "") % noImages.length;

  const noImage = noImages[randomIndex];

  return noImage;
};

export { randomNoImage, randomNoImageByName };
