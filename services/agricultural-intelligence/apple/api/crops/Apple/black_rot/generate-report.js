module.exports = async function handler(req, res) {

  // ============================================================
  // METHOD
  // ============================================================

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }


  try {

    console.log(
      "GEMINI KEY EXISTS:",
      !!process.env.GEMINI_API_KEY
    );


    // ============================================================
    // INPUT
    // ============================================================

    const {
      disease = "Unknown Disease",
      confidence = 0,
      country = "",
      district = "",
      cropOrAnimal = ""
    } = req.body;


    // ============================================================
    // NORMALIZE INPUT
    // ============================================================

    const numericConfidence =
      Number(confidence) || 0;

    const safeDisease =
      String(disease || "").trim();

    const safeCountry =
      String(country || "").trim();

    const safeDistrict =
      String(district || "").trim();

    const safeCropOrAnimal =
      String(cropOrAnimal || "").trim();


    const confidenceLevel =
      numericConfidence >= 90
        ? "High"
        : numericConfidence >= 70
        ? "Medium"
        : "Low";


    // ============================================================
    // GEMINI PROMPT
    //
    // IMPORTANT:
    // Gemini now returns JSON.
    // NOT HTML.
    // NOT Markdown.
    // ============================================================

    const prompt = `

You are a senior agricultural advisor, plant pathologist,
livestock health specialist, and agricultural research assistant.

Analyze this agricultural detection.

Disease/Pest:
${safeDisease}

AI Confidence:
${numericConfidence}%

Country:
${safeCountry}

District:
${safeDistrict}

Crop or Animal:
${safeCropOrAnimal}


Return ONE valid JSON object.

DO NOT return Markdown.

DO NOT return HTML.

DO NOT use triple backticks.

DO NOT add explanations outside the JSON.

The JSON must follow this exact structure:

{
  "overview": "",
  "severity": "",
  "immediateActions": [],
  "treatmentPlan": {
    "culturalControl": [],
    "biologicalControl": [],
    "chemicalControl": [],
    "integratedDiseaseManagement": []
  },
  "prevention": [],
  "economicImpact": [],
  "monitoringPlan": [],
  "scientificReferences": [],
  "referenceImages": []
}


============================================================
OVERVIEW
============================================================

Explain:

- what the disease or pest is
- symptoms
- causal organism where applicable
- disease or pest cycle
- transmission
- favourable environmental conditions
- practical agricultural context


============================================================
SEVERITY
============================================================

Explain:

- severity
- likely agricultural consequences
- possible yield losses where evidence supports them
- economic importance

Do NOT invent numerical yield-loss percentages.


============================================================
IMMEDIATE ACTIONS
============================================================

Provide practical actions farmers can take immediately.

Return an array of concise action items.


============================================================
TREATMENT PLAN
============================================================

Separate recommendations into:

culturalControl

biologicalControl

chemicalControl

integratedDiseaseManagement


For chemical recommendations:

- Do not invent registrations.
- Do not invent legal approvals.
- Do not invent application rates.
- Do not invent withholding periods.
- Do not claim a pesticide is approved in Botswana unless verified.
- Clearly tell the user to follow the current product label and
  applicable national agricultural regulations.

Only mention products or active ingredients when appropriate.


============================================================
PREVENTION
============================================================

Provide long-term prevention measures.

Return an array.


============================================================
ECONOMIC IMPACT
============================================================

Explain:

- yield effects
- quality effects
- production costs
- possible food-security implications

Do not invent unsupported numerical estimates.

Return an array.


============================================================
MONITORING PLAN
============================================================

Provide:

- scouting frequency
- what farmers should inspect
- disease/pest progression indicators
- warning signs
- indicators that management is working

Return an array.


============================================================
SCIENTIFIC REFERENCES
============================================================

Return an array of REAL references.

Each reference must have:

{
  "title": "",
  "authors": "",
  "year": "",
  "organization": "",
  "url": ""
}

Prefer authoritative sources such as:

- FAO
- CABI
- CIMMYT
- USDA
- NCBI
- APS
- universities
- government agricultural agencies
- peer-reviewed scientific journals

IMPORTANT:

Do NOT fabricate references.

Do NOT fabricate DOI numbers.

Do NOT fabricate URLs.

If you cannot confidently provide a real URL,
use an empty string instead of inventing one.


============================================================
REFERENCE IMAGES
============================================================

Return an array.

Each object must have:

{
  "caption": "",
  "imageUrl": "",
  "sourceUrl": ""
}

Only provide an image URL if you are confident it is a
real publicly accessible image.

Do NOT fabricate image URLs.

If a reliable image URL cannot be provided,
return an empty array.

`;


    // ============================================================
    // GEMINI REQUEST
    // ============================================================

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          contents: [

            {
              parts: [

                {
                  text: prompt
                }

              ]
            }

          ],

          generationConfig: {

            temperature: 0.2,

            responseMimeType: "application/json"

          }

        })

      }
    );


    // ============================================================
    // GEMINI RESPONSE
    // ============================================================

    const data =
      await geminiResponse.json();


    console.log(
      "FULL GEMINI RESPONSE:",
      JSON.stringify(
        data,
        null,
        2
      )
    );


    // ============================================================
    // GEMINI ERROR
    // ============================================================

    if (data.error) {

      return res.status(500).json({

        success: false,

        error:
          data.error.message,

        gemini:
          data

      });

    }


    // ============================================================
    // GET TEXT
    // ============================================================

    let rawText =
      data
        ?.candidates
        ?.[0]
        ?.content
        ?.parts
        ?.[0]
        ?.text;


    if (!rawText) {

      return res.status(500).json({

        success: false,

        error:
          "Gemini returned no report",

        gemini:
          data

      });

    }


    // ============================================================
    // CLEAN POSSIBLE CODE FENCES
    // ============================================================

    rawText =
      rawText

        .replace(
          /^```json\s*/i,
          ""
        )

        .replace(
          /^```\s*/i,
          ""
        )

        .replace(
          /\s*```$/i,
          ""
        )

        .trim();


    // ============================================================
    // PARSE JSON
    // ============================================================

    let aiReport;


    try {

      aiReport =
        JSON.parse(
          rawText
        );

    } catch (jsonError) {

      console.error(
        "GEMINI JSON PARSE ERROR:",
        jsonError
      );

      console.error(
        "RAW GEMINI TEXT:",
        rawText
      );


      return res.status(500).json({

        success: false,

        error:
          "Gemini returned invalid JSON",

        rawResponse:
          rawText

      });

    }


    // ============================================================
    // SAFE ARRAYS
    // ============================================================

    const immediateActions =
      Array.isArray(
        aiReport.immediateActions
      )
        ? aiReport.immediateActions
        : [];


    const culturalControl =
      Array.isArray(
        aiReport
          ?.treatmentPlan
          ?.culturalControl
      )
        ? aiReport
            .treatmentPlan
            .culturalControl
        : [];


    const biologicalControl =
      Array.isArray(
        aiReport
          ?.treatmentPlan
          ?.biologicalControl
      )
        ? aiReport
            .treatmentPlan
            .biologicalControl
        : [];


    const chemicalControl =
      Array.isArray(
        aiReport
          ?.treatmentPlan
          ?.chemicalControl
      )
        ? aiReport
            .treatmentPlan
            .chemicalControl
        : [];


    const integratedDiseaseManagement =
      Array.isArray(
        aiReport
          ?.treatmentPlan
          ?.integratedDiseaseManagement
      )
        ? aiReport
            .treatmentPlan
            .integratedDiseaseManagement
        : [];


    const prevention =
      Array.isArray(
        aiReport.prevention
      )
        ? aiReport.prevention
        : [];


    const economicImpact =
      Array.isArray(
        aiReport.economicImpact
      )
        ? aiReport.economicImpact
        : [];


    const monitoringPlan =
      Array.isArray(
        aiReport.monitoringPlan
      )
        ? aiReport.monitoringPlan
        : [];


    const scientificReferences =
      Array.isArray(
        aiReport.scientificReferences
      )
        ? aiReport.scientificReferences
        : [];


    const referenceImages =
      Array.isArray(
        aiReport.referenceImages
      )
        ? aiReport.referenceImages
        : [];


    // ============================================================
    // MARKDOWN HELPERS
    // ============================================================

    const markdownList =
      (items) => {

        if (
          !Array.isArray(items) ||
          items.length === 0
        ) {
          return "No specific recommendations available.";
        }

        return items
          .map(
            item =>
              `- ${String(item)}`
          )
          .join("\n");

      };


    // ============================================================
    // REFERENCES → MARKDOWN
    // ============================================================

    const referencesMarkdown =
      scientificReferences.length > 0

        ? scientificReferences
            .map(
              ref => {

                const title =
                  ref.title || "Untitled source";

                const authors =
                  ref.authors || "";

                const year =
                  ref.year || "";

                const organization =
                  ref.organization || "";

                const url =
                  ref.url || "";


                const sourceName =
                  [
                    authors,
                    organization
                  ]
                    .filter(Boolean)
                    .join(", ");


                const citation =
                  [
                    title,
                    sourceName,
                    year
                  ]
                    .filter(Boolean)
                    .join(" — ");


                if (url) {

                  return `- [${citation}](${url})`;

                }

                return `- ${citation}`;

              }
            )
            .join("\n")

        : "- No verified scientific references were returned.";


    // ============================================================
    // REFERENCE IMAGES → MARKDOWN
    // ============================================================

    const imagesMarkdown =
      referenceImages.length > 0

        ? referenceImages
            .map(
              image => {

                const caption =
                  image.caption ||
                  "Reference image";

                const imageUrl =
                  image.imageUrl ||
                  "";

                const sourceUrl =
                  image.sourceUrl ||
                  "";


                if (
                  imageUrl &&
                  sourceUrl
                ) {

                  return `![${caption}](${imageUrl})\n[Source](${sourceUrl})`;

                }


                if (sourceUrl) {

                  return `[${caption}](${sourceUrl})`;

                }


                return `- ${caption}`;

              }
            )
            .join("\n\n")

        : "No reference images available.";


    // ============================================================
    // BUILD MARKDOWN REPORT
    // ============================================================

    const reportMarkdown = `

## Overview

${aiReport.overview || "No overview available."}


## Severity

${aiReport.severity || "No severity assessment available."}


## Immediate Actions

${markdownList(
  immediateActions
)}


## Treatment Plan

### Cultural Control

${markdownList(
  culturalControl
)}


### Biological Control

${markdownList(
  biologicalControl
)}


### Chemical Control

${markdownList(
  chemicalControl
)}


### Integrated Disease Management

${markdownList(
  integratedDiseaseManagement
)}


## Prevention

${markdownList(
  prevention
)}


## Economic Impact

${markdownList(
  economicImpact
)}


## Monitoring Plan

${markdownList(
  monitoringPlan
)}


## Scientific References

${referencesMarkdown}


## Reference Images

${imagesMarkdown}

`.trim();


    // ============================================================
    // HTML ESCAPE
    // ============================================================

    const escapeHtml =
      (value) => {

        return String(
          value ?? ""
        )

          .replace(
            /&/g,
            "&amp;"
          )

          .replace(
            /</g,
            "&lt;"
          )

          .replace(
            />/g,
            "&gt;"
          )

          .replace(
            /"/g,
            "&quot;"
          )

          .replace(
            /'/g,
            "&#039;"
          );

      };


    // ============================================================
    // ARRAY → HTML
    // ============================================================

    const arrayToHtml =
      (items) => {

        if (
          !Array.isArray(items) ||
          items.length === 0
        ) {

          return "<p>No specific recommendations available.</p>";

        }


        return `
<ul>
${items
  .map(
    item =>
      `<li>${escapeHtml(item)}</li>`
  )
  .join("\n")}
</ul>
`;

      };


    // ============================================================
    // REFERENCES → HTML
    // ============================================================

    const referencesHtml =
      scientificReferences.length > 0

        ? `
<ul>
${scientificReferences
  .map(
    ref => {

      const title =
        escapeHtml(
          ref.title || "Untitled source"
        );

      const authors =
        escapeHtml(
          ref.authors || ""
        );

      const organization =
        escapeHtml(
          ref.organization || ""
        );

      const year =
        escapeHtml(
          ref.year || ""
        );

      const url =
        String(
          ref.url || ""
        ).trim();


      const citation =
        [
          title,
          authors,
          organization,
          year
        ]
          .filter(Boolean)
          .join(" — ");


      if (url) {

        return `
<li>
<a
  href="${escapeHtml(url)}"
  target="_blank"
  rel="noopener noreferrer"
>
${citation}
</a>
</li>
`;

      }


      return `
<li>
${citation}
</li>
`;

    }
  )
  .join("\n")}
</ul>
`

        : "<p>No verified scientific references available.</p>";


    // ============================================================
    // IMAGES → HTML
    // ============================================================

    const referenceImagesHtml =
      referenceImages.length > 0

        ? `
<div class="reference-images">

${referenceImages
  .map(
    image => {

      const caption =
        escapeHtml(
          image.caption ||
          "Reference image"
        );

      const imageUrl =
        String(
          image.imageUrl || ""
        ).trim();

      const sourceUrl =
        String(
          image.sourceUrl || ""
        ).trim();


      if (
        imageUrl &&
        sourceUrl
      ) {

        return `
<div class="reference-image">

<img
  src="${escapeHtml(imageUrl)}"
  alt="${caption}"
/>

<p>
<a
  href="${escapeHtml(sourceUrl)}"
  target="_blank"
  rel="noopener noreferrer"
>
${caption}
</a>
</p>

</div>
`;

      }


      if (sourceUrl) {

        return `
<div class="reference-image">

<p>
<a
  href="${escapeHtml(sourceUrl)}"
  target="_blank"
  rel="noopener noreferrer"
>
${caption}
</a>
</p>

</div>
`;

      }


      return `
<div class="reference-image">
<p>${caption}</p>
</div>
`;

    }
  )
  .join("\n")}

</div>
`

        : "<p>No reference images available.</p>";


    // ============================================================
    // HTML REPORT
    // ============================================================

    const report = `

<h2>Overview</h2>

<p>
${escapeHtml(
  aiReport.overview ||
  "No overview available."
)}
</p>


<h2>Severity</h2>

<p>
${escapeHtml(
  aiReport.severity ||
  "No severity assessment available."
)}
</p>


<h2>Immediate Actions</h2>

${arrayToHtml(
  immediateActions
)}


<h2>Treatment Plan</h2>


<h3>Cultural Control</h3>

${arrayToHtml(
  culturalControl
)}


<h3>Biological Control</h3>

${arrayToHtml(
  biologicalControl
)}


<h3>Chemical Control</h3>

${arrayToHtml(
  chemicalControl
)}


<h3>Integrated Disease Management</h3>

${arrayToHtml(
  integratedDiseaseManagement
)}


<h2>Prevention</h2>

${arrayToHtml(
  prevention
)}


<h2>Economic Impact</h2>

${arrayToHtml(
  economicImpact
)}


<h2>Monitoring Plan</h2>

${arrayToHtml(
  monitoringPlan
)}


<h2>Scientific References</h2>

${referencesHtml}


<h2>Reference Images</h2>

${referenceImagesHtml}

`.trim();


    // ============================================================
    // STRUCTURED REPORT
    //
    // THIS IS THE IMPORTANT PART FOR FLUTTERFLOW
    // ============================================================

    const structuredReport = {

      // ----------------------------------------------------------
      // IDENTIFICATION
      // ----------------------------------------------------------

      diseaseName:
        safeDisease,


      // ----------------------------------------------------------
      // CONFIDENCE
      // ----------------------------------------------------------

      confidenceLevel:
        confidenceLevel,

      confidence:
        numericConfidence,


      // ----------------------------------------------------------
      // LOCATION
      // ----------------------------------------------------------

      country:
        safeCountry,

      district:
        safeDistrict,


      // ----------------------------------------------------------
      // CATEGORY
      // ----------------------------------------------------------

      cropOrAnimal:
        safeCropOrAnimal,


      // ----------------------------------------------------------
      // MAIN SECTIONS
      // ----------------------------------------------------------

      overview:
        aiReport.overview || "",

      severity:
        aiReport.severity || "",

      immediateActions:
        immediateActions.join("\n"),

      treatmentPlan:
        [
          ...culturalControl,
          ...biologicalControl,
          ...chemicalControl,
          ...integratedDiseaseManagement
        ].join("\n"),

      prevention:
        prevention.join("\n"),

      economicImpact:
        economicImpact.join("\n"),

      monitoringPlan:
        monitoringPlan.join("\n"),


      // ----------------------------------------------------------
      // TREATMENT SUB-SECTIONS
      // ----------------------------------------------------------

      culturalControl:
        culturalControl.join("\n"),

      biologicalControl:
        biologicalControl.join("\n"),

      chemicalControl:
        chemicalControl.join("\n"),

      integratedDiseaseManagement:
        integratedDiseaseManagement.join("\n"),


      // ----------------------------------------------------------
      // SCIENTIFIC REFERENCES
      //
      // OLD HTML STRING
      // ----------------------------------------------------------

      scientificReferences:
        referencesHtml,


      // ----------------------------------------------------------
      // REFERENCE IMAGES
      //
      // OLD HTML STRING
      // ----------------------------------------------------------

      referenceImages:
        referenceImagesHtml,


      // ----------------------------------------------------------
      // NEW ARRAYS
      //
      // VERY USEFUL FOR FLUTTERFLOW
      // ----------------------------------------------------------

      scientificReferencesList:
        scientificReferences,

      referenceImagesList:
        referenceImages

    };


    // ============================================================
    // FINAL RESPONSE
    // ============================================================

    return res.status(200).json({

      success: true,


      // ==========================================================
      // OPTION 1
      // MARKDOWN WIDGET
      // ==========================================================

      reportMarkdown,


      // ==========================================================
      // OPTION 2
      // EXISTING HTML UI
      // ==========================================================

      report,


      // ==========================================================
      // OPTION 3
      // STRUCTURED FLUTTERFLOW CARDS
      // ==========================================================

      structuredReport

    });


  } catch (error) {

    console.error(
      "API ERROR:",
      error
    );


    return res.status(500).json({

      success: false,

      error:
        error.message

    });

  }

}
