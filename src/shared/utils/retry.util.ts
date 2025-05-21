interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs?: number;
}

export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
  currentAttempt = 1
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (currentAttempt > options.maxRetries) {
      console.error(`Tentativas de retentativa esgotadas após ${options.maxRetries} tentativas.`);
      throw error;
    }

    // Atraso exponencial
    let delay = options.initialDelayMs * Math.pow(2, currentAttempt - 1);
    delay = delay + Math.random() * delay * 0.2;

    if (options.maxDelayMs && delay > options.maxDelayMs) {
      delay = options.maxDelayMs;
    }

    console.warn(`Tentativa ${currentAttempt} falhou. Retentando em ${delay.toFixed(0)}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));

    return retryWithExponentialBackoff(fn, options, currentAttempt + 1);
  }
}