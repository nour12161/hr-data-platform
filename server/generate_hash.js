import bcrypt from "bcrypt";

const plainPassword = "123456";

const run = async () => {
  const hash = await bcrypt.hash(plainPassword, 10);
  console.log("Voici le hash de 123456 :", hash);
};

run();
