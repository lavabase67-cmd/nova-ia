import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3.8-flash";

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use(express.static("."));

app.get("/api/status", function (req, res) {
    res.json({
        online: true,
        name: "NOVA IA",
        model: GEMINI_MODEL
    });
});

app.post("/api/chat", async function (req, res) {
    try {
        const message = req.body && req.body.message;

        if (!message || typeof message !== "string") {
            return res.status(400).json({
                error: "Aucun message reçu."
            });
        }

        if (!GEMINI_API_KEY) {
            return res.status(500).json({
                error: "GEMINI_API_KEY est absente du fichier .env."
            });
        }

        console.log("Message reçu :", message);

        const geminiUrl =
            "https://generativelanguage.googleapis.com/v1beta/models/" +
            GEMINI_MODEL +
            ":generateContent";

        const geminiResponse = await fetch(geminiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": GEMINI_API_KEY
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: message
                            }
                        ]
                    }
                ]
            })
        });

        const data = await geminiResponse.json();

        if (!geminiResponse.ok) {
            console.error("Erreur Gemini :", data);

            return res.status(geminiResponse.status).json({
                error:
                    data &&
                    data.error &&
                    data.error.message
                        ? data.error.message
                        : "Erreur Gemini."
            });
        }

        const answer =
            data &&
            data.candidates &&
            data.candidates[0] &&
            data.candidates[0].content &&
            data.candidates[0].content.parts &&
            data.candidates[0].content.parts[0] &&
            data.candidates[0].content.parts[0].text;

        if (!answer) {
            console.error("Réponse Gemini inattendue :", data);

            return res.status(500).json({
                error: "Gemini n'a pas retourné de réponse."
            });
        }

        console.log("Réponse NOVA reçue.");

        return res.json({
            answer: answer
        });

    } catch (error) {
        console.error("Erreur serveur :", error);

        return res.status(500).json({
            error: "Erreur interne du serveur.",
            details: error.message
        });
    }
});

app.use("/api", function (req, res) {
    res.status(404).json({
        error: "Route API introuvable.",
        route: req.originalUrl
    });
});

app.listen(PORT, function () {
    console.log("");
    console.log("================================");
    console.log(" NOVA IA");
    console.log("================================");
    console.log("Site : http://localhost:" + PORT);
    console.log("API : http://localhost:" + PORT + "/api/chat");
    console.log("Test : http://localhost:" + PORT + "/api/status");
    console.log("Modele : " + GEMINI_MODEL);
    console.log("================================");
    console.log("");
});
