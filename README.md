# Gemini Chatbot 

Proyek ini adalah aplikasi **Node.js + Express** dengan frontend **Vanilla JS** yang terintegrasi dengan **Google Gemini API**.  
Aplikasi menyediakan:

- Chatbot berbasis web (chat history) dengan endpoint `/api/chat`
- Endpoint teks sederhana: `/generate-text`
- Endpoint gambar → teks: `/generate-from-image`
- Endpoint dokumen → ringkasan: `/generate-from-document`
- Endpoint audio → transkrip: `/generate-from-audio`
- Frontend sederhana di folder `public/` untuk mencoba semua fitur tersebut

---

## Fitur

### 1. Chatbot (conversation)
- Menyimpan riwayat percakapan di frontend
- Mengirim array `conversation` ke backend
- Backend memanggil Gemini dengan model `gemini-2.5-flash`

Endpoint: `POST /api/chat`

Body contoh:

```json
{
  "conversation": [
    { "role": "user", "text": "Apa itu Gemini API?" },
    { "role": "model", "text": "Jawaban sebelumnya..." },
    { "role": "user", "text": "Jelaskan lebih sederhana." }
  ]
}
