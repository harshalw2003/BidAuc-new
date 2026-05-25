const toast = {
  success: (message) => {
    if (typeof window !== 'undefined') {
      console.log('SUCCESS:', message);
    }
  },
  error: (message) => {
    if (typeof window !== 'undefined') {
      console.error('ERROR:', message);
      if (process.env.NODE_ENV === 'development') {
        alert(`Error: ${message}`);
      }
    }
  },
  info: (message) => {
    if (typeof window !== 'undefined') {
      console.info('INFO:', message);
    }
  }
};

export { toast };