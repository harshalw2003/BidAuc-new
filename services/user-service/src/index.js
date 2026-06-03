// Update handleMessage function
const handleMessage = async (routingKey, data) => {
  switch (routingKey) {
    case 'user.registered':
      await handleUserRegistered(data);
      break;
    case 'user.updated':
      await handleUserUpdated(data);
      break;
    default:
      console.warn(`⚠️  Unknown routing key: ${routingKey}`);
  }
};