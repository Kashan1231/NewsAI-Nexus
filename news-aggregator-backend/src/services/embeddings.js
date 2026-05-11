export async function getEmbedding(text) {
  try {
    const res = await fetch(
      'https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: text }),
      }
    )
    const data = await res.json()
    if (Array.isArray(data) && typeof data[0] === 'number') return data
    if (Array.isArray(data) && Array.isArray(data[0])) return data[0]
    return null
  } catch (e) {
    console.error('Embedding error:', e)
    return null
  }
}