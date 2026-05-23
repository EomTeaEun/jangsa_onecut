import RunwayML from '@runwayml/sdk'

function getRunwayClient(apiKey: string) {
  return new RunwayML({ apiKey })
}

const MAX_PROMPT_LENGTH = 950

const KOREAN_TEXT_PREFIX = 'Korean language text only in image, no Chinese characters. '

export async function startImageGeneration(
  prompt: string,
  apiKey: string
): Promise<string> {
  const client = getRunwayClient(apiKey)
  const fullPrompt = (KOREAN_TEXT_PREFIX + prompt).slice(0, MAX_PROMPT_LENGTH)
  const task = await client.textToImage.create({
    model: 'gen4_image',
    promptText: fullPrompt,
    ratio: '720:1280',
  })
  return task.id
}

export async function startVideoGeneration(
  prompt: string,
  apiKey: string
): Promise<string> {
  const client = getRunwayClient(apiKey)
  const task = await client.textToVideo.create({
    model: 'gen4.5',
    promptText: prompt.slice(0, MAX_PROMPT_LENGTH),
    ratio: '720:1280',
    duration: 5,
  })
  return task.id
}

export async function getTaskStatus(taskId: string, apiKey: string) {
  const client = getRunwayClient(apiKey)
  const task = await client.tasks.retrieve(taskId)
  const t = task as { status: string; output?: string[]; failure?: string; failureCode?: string }
  return {
    status: t.status,
    output: t.output,
    error: t.failureCode || t.failure,
  }
}
