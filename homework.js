const axios = require('axios');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { subject, question, image } = req.body;
    
    // ดึงค่า Token และ Webhook จากระบบหลังบ้าน Vercel
    const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;
    const AI_API_KEY = process.env.AI_API_KEY; // เอา Token API ตัวเดียวของคุณมาใส่ในนี้บนเว็บ Vercel

    try {
        let aiResponse = "";
        
        // ตรวจสอบว่ากรอกคำถามหรือส่งรูปมาไหม
        if (!question && !image) {
            return res.status(400).json({ success: false, error: 'กรุณากรอกคำถามหรือแนบรูปภาพ' });
        }

        // =================================================================
        // 🤖 ส่วนที่ 1: ยิงตรงหา Google Gemini API (ใช้ Token ตัวเดียว)
        // =================================================================
        
        // ตั้งค่าหัวข้อคำสั่ง (Prompt) เพื่อบังคับให้ AI ตอบวิชานั้นๆ อย่างแม่นยำ
        const systemPrompt = `คุณคือ AI ผู้เชี่ยวชาญด้านการศึกษา ช่วยทำการบ้านวิชา ${subject} ต่อไปนี้อย่างละเอียดและถูกต้อง: ${question || ''}`;
        
        let contents = [];

        if (image) {
            // ถ้ามีรูปภาพเข้ามา (ส่งมาเป็น Base64 จากหน้าเว็บ)
            const base64Data = image.split(',')[1]; // ตัดส่วนหัว data:image/png;base64 ออก
            const mimeType = image.split(';')[0].split(':')[1]; // ดึงประเภทไฟล์ เช่น image/jpeg
            
            contents.push({
                parts: [
                    { text: systemPrompt },
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Data
                        }
                    }
                ]
            });
        } else {
            // ถ้ามีเฉพาะข้อความ
            contents.push({
                parts: [{ text: systemPrompt }]
            });
        }

        // เรียกใช้งาน Gemini API 
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${AI_API_KEY}`;
        
        const geminiRes = await axios.post(geminiUrl, { contents: contents }, {
            headers: { 'Content-Type': 'application/json' }
        });

        // ดึงข้อความคำตอบที่ AI เจนออกมา
        if (geminiRes.data.candidates && geminiRes.data.candidates[0].content.parts[0].text) {
            aiResponse = geminiRes.data.candidates[0].content.parts[0].text;
        } else {
            aiResponse = "ไม่สามารถสร้างคำตอบจากโจทย์นี้ได้ กรุณาลองใหม่อีกครั้ง";
        }

        // =================================================================
        // 💬 ส่วนที่ 2: ส่งคำตอบที่ได้ เข้า Discord Webhook
        // =================================================================
        const discordEmbed = {
            title: `📚 ส่งการบ้านวิชา: ${subject}`,
            color: 3447003, // สีน้ำเงิน
            fields: [
                { 
                    name: "❓ โจทย์ / คำถาม", 
                    value: question || "ส่งมาเป็นรูปภาพ (ตรวจสอบได้ที่หน้าเว็บ)", 
                    inline: false 
                },
                { 
                    name: "💡 คำตอบจาก AI", 
                    value: aiResponse.length > 1024 ? aiResponse.substring(0, 1020) + "..." : aiResponse, 
                    inline: false 
                }
            ],
            footer: { text: "AI Homework Assistant" },
            timestamp: new Date()
        };

        // ยิงเข้าดิสคอร์ด
        await axios.post(DISCORD_WEBHOOK, {
            username: "AI Homework Bot",
            avatar_url: "https://cdn-icons-png.flaticon.com/512/4712/4712139.png",
            embeds: [discordEmbed]
        });

        // =================================================================
        // ✨ ส่วนที่ 3: ส่งคำตอบกลับไปแสดงบนหน้าเว็บของคุณ
        // =================================================================
        return res.status(200).json({ 
            success: true, 
            answer: aiResponse 
        });

    } catch (error) {
        console.error("Error Details:", error.response ? error.response.data : error.message);
        return res.status(500).json({ 
            success: false, 
            error: "เกิดข้อผิดพลาดในการประมวลผลระบบ AI" 
        });
    }
}
