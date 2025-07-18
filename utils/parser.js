
async function parseReceiptWithGemini(ocrText) {
    const prompt = `
        You are an expert receipt parser. Extract the following details from the provided receipt text:
        - merchantName: The name of the merchant.
        - amount: The total amount of the transaction.
        - date: The date of the transaction (in YYYY-MM-DD format).
        - description: A brief summary of the items purchased or the purpose of the transaction.
        - category: The most appropriate category for the transaction (e.g., Groceries, Food, Travel, Electronics, Entertainment, Utilities, Health, Education, Shopping, Transport, Bills, Other).
        - paymentMethod: The method of payment (e.g., Cash, Credit Card, Debit Card, UPI, Netbanking, Wallet).
        - transactionType: The type of transaction (e.g., Purchase, Refund, Withdrawal, Transfer, Deposit).

        If a field cannot be found, return null for that field, except for 'description' which should be a concise summary.
        Prioritize 'Total', 'Amount Due', 'Grand Total' for amount.
        Prioritize common date formats.

        Receipt Text:
        "${ocrText}"
    `;

    const responseSchema = {
        type: "OBJECT",
        properties: {
            merchantName: { type: "STRING", nullable: true },
            amount: { type: "NUMBER", nullable: true },
            date: { type: "STRING", nullable: true }, // YYYY-MM-DD
            description: { type: "STRING", nullable: true },
            category: { type: "STRING", nullable: true },
            paymentMethod: { type: "STRING", nullable: true },
            transactionType: { type: "STRING", nullable: true }
        },
        propertyOrdering: [
            "merchantName",
            "amount",
            "date",
            "description",
            "category",
            "paymentMethod",
            "transactionType"
        ]
    };

    let chatHistory = [];
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });

    const payload = {
        contents: chatHistory,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchema
        }
    };

    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API Error Response:', errorData);
            throw new Error(`Gemini API request failed with status ${response.status}: ${JSON.stringify(errorData)}`);
        }

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const jsonString = result.candidates[0].content.parts[0].text;
            const parsedGeminiData = JSON.parse(jsonString);

            return {
                merchantName: parsedGeminiData.merchantName || 'Unknown Merchant',
                amount: parsedGeminiData.amount || 0,
                date: parsedGeminiData.date || new Date().toISOString().split('T')[0],
                description: parsedGeminiData.description || 'No description provided.',
                category: parsedGeminiData.category || 'Uncategorized', 
                paymentMethod: parsedGeminiData.paymentMethod || null,
                transactionType: parsedGeminiData.transactionType || 'Purchase'
            };

        } else {
            console.error('Unexpected Gemini API response structure:', result);
            throw new Error('Gemini API returned an unexpected response structure.');
        }
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        throw new Error(`Failed to parse receipt with Gemini API: ${error.message}`);
    }
}

module.exports = { parseReceiptWithGemini };