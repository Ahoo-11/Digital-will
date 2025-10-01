import * as bitcoin from 'bitcoinjs-lib';

/**
 * Create an Ordinal inscription script for encrypted data
 * 
 * Ordinal inscription format:
 * OP_FALSE
 * OP_IF
 *   OP_PUSH "ord"
 *   OP_PUSH 1
 *   OP_PUSH "text/plain;charset=utf-8"
 *   OP_PUSH 0
 *   OP_PUSH <data>
 * OP_ENDIF
 */
export function createOrdinalInscription(data, contentType = 'text/plain;charset=utf-8') {
  const chunks = [
    bitcoin.opcodes.OP_FALSE,
    bitcoin.opcodes.OP_IF,
    Buffer.from('ord', 'utf8'),
    Buffer.from([0x01]), // Protocol version
    Buffer.from(contentType, 'utf8'),
    Buffer.from([0x00]), // Separator
    Buffer.from(data, 'utf8'),
    bitcoin.opcodes.OP_ENDIF
  ];
  
  return bitcoin.script.compile(chunks);
}

/**
 * Create an OP_RETURN output with data
 * (Simpler alternative for MVP, not a true Ordinal inscription)
 */
export function createOpReturnOutput(data) {
  const dataBuffer = Buffer.from(data, 'utf8');
  
  // OP_RETURN can hold up to 80 bytes in standard transactions
  // For larger data, we need to split or use different method
  if (dataBuffer.length > 80) {
    console.warn('Data exceeds OP_RETURN limit (80 bytes). Consider using proper Ordinal inscription.');
  }
  
  return bitcoin.script.compile([
    bitcoin.opcodes.OP_RETURN,
    dataBuffer
  ]);
}

/**
 * Parse an Ordinal inscription from script
 */
export function parseOrdinalInscription(script) {
  try {
    const decompiled = bitcoin.script.decompile(script);
    
    if (!decompiled || decompiled.length < 7) {
      throw new Error('Invalid inscription script');
    }
    
    // Check for OP_FALSE OP_IF pattern
    if (decompiled[0] !== bitcoin.opcodes.OP_FALSE || 
        decompiled[1] !== bitcoin.opcodes.OP_IF) {
      throw new Error('Not an Ordinal inscription');
    }
    
    // Extract components
    const protocol = decompiled[2]?.toString('utf8');
    const version = decompiled[3]?.[0];
    const contentType = decompiled[4]?.toString('utf8');
    const data = decompiled[6]?.toString('utf8');
    
    return {
      protocol,
      version,
      contentType,
      data
    };
  } catch (error) {
    console.error('Error parsing inscription:', error);
    throw error;
  }
}

/**
 * Estimate inscription size
 */
export function estimateInscriptionSize(data, contentType = 'text/plain;charset=utf-8') {
  const overhead = 
    1 + // OP_FALSE
    1 + // OP_IF
    1 + 3 + // OP_PUSH "ord"
    1 + 1 + // OP_PUSH version
    1 + contentType.length + // OP_PUSH content type
    1 + 1 + // OP_PUSH separator
    1 + // OP_ENDIF
    Math.ceil(data.length / 520) * 3; // Data push opcodes (max 520 bytes per push)
  
  return data.length + overhead;
}

/**
 * Split large data into chunks for inscription
 * (Bitcoin script push operations are limited to 520 bytes)
 */
export function chunkData(data, chunkSize = 520) {
  const chunks = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Create a multi-chunk Ordinal inscription for large data
 */
export function createLargeOrdinalInscription(data, contentType = 'text/plain;charset=utf-8') {
  const dataChunks = chunkData(data, 520);
  
  const chunks = [
    bitcoin.opcodes.OP_FALSE,
    bitcoin.opcodes.OP_IF,
    Buffer.from('ord', 'utf8'),
    Buffer.from([0x01]), // Protocol version
    Buffer.from(contentType, 'utf8'),
    Buffer.from([0x00]), // Separator
  ];
  
  // Add all data chunks
  for (const chunk of dataChunks) {
    chunks.push(Buffer.from(chunk, 'utf8'));
  }
  
  chunks.push(bitcoin.opcodes.OP_ENDIF);
  
  return bitcoin.script.compile(chunks);
}

/**
 * Validate inscription data
 */
export function validateInscriptionData(data) {
  const errors = [];
  
  if (!data || data.length === 0) {
    errors.push('Data cannot be empty');
  }
  
  // Check size (reasonable limit for MVP)
  const maxSize = 10 * 1024; // 10 KB
  if (data.length > maxSize) {
    errors.push(`Data too large (${data.length} bytes). Maximum: ${maxSize} bytes`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    size: data.length,
    estimatedInscriptionSize: estimateInscriptionSize(data)
  };
}

/**
 * Create inscription metadata
 */
export function createInscriptionMetadata(data, contentType, additionalMetadata = {}) {
  return {
    protocol: 'ord',
    version: 1,
    contentType,
    size: data.length,
    timestamp: Math.floor(Date.now() / 1000),
    ...additionalMetadata
  };
}

/**
 * Format inscription for display
 */
export function formatInscriptionForDisplay(inscription) {
  return {
    protocol: inscription.protocol || 'unknown',
    version: inscription.version || 'unknown',
    contentType: inscription.contentType || 'unknown',
    dataSize: inscription.data?.length || 0,
    dataPreview: inscription.data?.slice(0, 100) + (inscription.data?.length > 100 ? '...' : '')
  };
}
