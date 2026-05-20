import bcrypt from "bcrypt";

const run = async () => {
  const hash = await bcrypt.hash("0000", 10);
  console.log("✅ Hash pour 123456 :", hash);
};

run();