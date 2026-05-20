import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; 

  if (!token) {
    return res.status(401).json({ message: "Token manquant. Veuillez vous reconnecter." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.user = decoded; //ajout des infos du token
    next();
  } catch (err) {
    console.error("🔐 Erreur de vérification du token :", err);
    return res.status(403).json({ message: "Token invalide ou expiré." });
  }
};

export default verifyToken;
