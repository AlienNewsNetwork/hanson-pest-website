export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, mediaType } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: image
              }
            },
            {
              type: 'text',
              text: `You are a pest identification expert for Hanson Pest & Wildlife in Eastern Oklahoma. Analyze this image and identify any pest, insect, rodent, wildlife, or signs of infestation (droppings, damage, nests, etc.).

Respond ONLY with valid JSON in this exact format (no markdown, no backticks):
{
  "identified": true,
  "pestName": "Common name of the pest",
  "scientificName": "Scientific/Latin name",
  "icon": "Single emoji representing this pest",
  "confidence": 85,
  "description": "2-3 sentence description of what this pest is and its characteristics",
  "risks": "2-3 sentences about health risks, property damage, or concerns",
  "treatment": "2-3 sentences about professional treatment methods",
  "prevention": ["Prevention tip 1", "Prevention tip 2", "Prevention tip 3", "Prevention tip 4"],
  "priceRange": "$150 - $300",
  "category": "general_pest|rodent|wildlife|stinging|bed_bug|termite|snake"
}

If the image does not show a pest, insect, animal, or signs of infestation, respond with:
{
  "identified": false,
  "message": "Brief explanation of what you see instead"
}

Base pricing on these Hanson Pest & Wildlife rates:
- General Pest Control: From $100
- Rodent Control: From $150  
- Stinging Insects: From $150
- Wildlife Removal: From $200
- Squirrel Exclusion: From $200
- Snake Removal: From $150
- Bed Bug Treatment: From $350
- Termite Protection: From $500`
            }
          ]
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const textContent = data.content.find(c => c.type === 'text');
    const cleanedText = textContent.text.replace(/```json\n?|\n?```/g, '').trim();
    const result = JSON.parse(cleanedText);

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
