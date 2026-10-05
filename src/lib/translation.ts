interface MyMemoryResponse {
  responseStatus?: number
  responseDetails?: string
  responseData?: {
    translatedText?: string
  }
}

export async function translateEnglishToArabic(text: string): Promise<string> {
  const trimmedText = text.trim()
  if (!trimmedText) {
    throw new Error('Enter an English word before translating.')
  }

  const params = new URLSearchParams({
    q: trimmedText,
    langpair: 'en|ar',
  })
  const response = await fetch(`https://api.mymemory.translated.net/get?${params}`)
  if (!response.ok) {
    throw new Error(`Translation service returned an error (${response.status}).`)
  }

  const result = await response.json() as MyMemoryResponse
  const translatedText = result.responseData?.translatedText?.trim()
  if (result.responseStatus !== 200 || !translatedText) {
    throw new Error(result.responseDetails || 'Could not translate this word.')
  }

  return translatedText
}
