const express = require("express");
const cors = require("cors");

const fs = require("fs");
const path = require("path");


const promptTemplate = fs.readFileSync(
  path.join(__dirname, "templateone.txt"),
  "utf8"
);

const promtwritter =fs.readFileSync(
  path.join(__dirname, "templateonewriter.txt"),
  "utf8"  
)


function cleanJSON(text){

    return text
        .replace(/<<</g, "")
        .replace(/>>>/g, "")
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

}

const myapp = express();

myapp.use(cors());
myapp.use(express.json({ limit: "50mb" }));
myapp.use(express.urlencoded({ limit: "50mb", extended: true }));


myapp.get("/", (req, res) => res.send("server is running 🚀"));



myapp.post("/api/ai/generate-summary", async (req, res) => {

  try {

    const { cv_text } = req.body;


    if (!cv_text || cv_text.trim() === "") {
      return res.status(400).json({
        error: "cv_text is empty"
      });
    }


    const prompt = promptTemplate.replace("{TEXT}", cv_text);



    const response = await fetch(
      "http://localhost:11434/api/generate",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },

        body: JSON.stringify({

          model: "qwen2.5:3b",

          prompt,

          stream: false,

          options: {
            temperature: 0.2,
            num_predict: 1500
          }

        })

      }
    );




    async function runAI(prompt, model) {

  const response = await fetch(
    "http://localhost:11434/api/generate",
    {
      method:"POST",

      headers:{
        "Content-Type":"application/json"
      },

      body:JSON.stringify({

        model,

        prompt,

        stream:false,

        options:{
          temperature:0.2,
          num_predict:2000
        }

      })
    }
  );


  const data = await response.json();

  return data.response;
}


    const rawText = await response.text();

    const ollama = JSON.parse(rawText);


    console.log("OLLAMA RESPONSE:", ollama);



    if (!ollama.response) {

      return res.status(200).json({
        warning: "AI returned empty response",
        raw: ollama
      });

    }



    let result;


    try {

      result = JSON.parse(ollama.response);


let realdata = validateUserData(
    result,
    cv_text
);


// SECOND AI LAYER

const writerPrompt =
promtwritter.replace(
  "{JSON}",
  JSON.stringify(realdata)
);


const writerResponse = await runAI(
    writerPrompt,
    "qwen2.5:3b"
);
console.log("WRITER RAW RESPONSE:");
console.log(writerResponse);



let portfolioData;


try {

portfolioData = JSON.parse(
    cleanJSON(writerResponse)
);

}
catch(err){

    console.log(
      "Writer AI failed, returning extractor data"
    );

    portfolioData = realdata;

}


const finalData = validateUserData(
    portfolioData,
    cv_text
);

return res.json(finalData);

    } catch(err) {


      return res.status(200).json({

        warning: "AI did not return valid JSON",

        raw: ollama.response

      });

    }



  } catch(err) {


    console.error(
      "AI ROUTE ERROR:",
      err
    );


    res.status(500).json({
      error: err.message
    });

  }

});





function validateUserData(data, originalText) {


    originalText = originalText || "";


    data.name = data.name || "";
    data.email = data.email || "";
    data.phone = data.phone || "";



    data.name = validateName(
        data.name,
        originalText
    );


    data.email = validateEmail(
        data.email,
        originalText
    );


    data.phone = validatePhone(
        data.phone,
        originalText
    );



    return data;

}





function validatePhone(aiPhone, originalText) {


    if (!aiPhone) return "";



    const cleanPhone =
        aiPhone.replace(/[()\s-]/g, "");



    const phoneRegex =
        /^\+?\d{7,15}$/;



    if (!phoneRegex.test(cleanPhone)) {

        return "";

    }



    const cleanOriginal =
        originalText.replace(/[()\s-]/g, "");



    if (!cleanOriginal.includes(cleanPhone)) {

        return "";

    }



    return aiPhone.trim();

}





function validateEmail(aiEmail, originalText) {


    if (!aiEmail) return "";



    const email =
        aiEmail.trim().toLowerCase();



    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;



    if (!emailRegex.test(email)) {

        return "";

    }



    if (
      !originalText
      .toLowerCase()
      .includes(email)
    ) {

        return "";

    }



    return email;

}





function validateName(aiName, originalText) {


  if (!aiName) return "";



  const cleanAI =
    aiName.toLowerCase().trim();



  const cleanText =
    originalText.toLowerCase();



  if (!cleanText.includes(cleanAI)) {

    return "";

  }



  if (aiName.length > 25) {

    return "";

  }



  return aiName.trim();

}





myapp.listen(
  5000,
  () => console.log("Server running on port 5000")
);