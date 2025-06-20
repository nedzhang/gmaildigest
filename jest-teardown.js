const net = require('net');
const tls = require('tls');

const { closeFirestore, closeFirebaseAdmin } = require('./src/lib/firestore/firestore-auth');

module.exports = async () => {

  console.log('Global teardown starting...');

  console.log('Closing firestore and firebaseadmin...');

  try {
    await Promise.all([
      closeFirestore(),
      closeFirebaseAdmin()
    ]);
  } catch (error) {
    console.error('Global teardown error:', error);
  }

  // Wait for pending operations
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Get all open handles
  const openHandles = process._getActiveHandles();

  console.log(`Found ${openHandles.length} active handles`);
  openHandles.forEach(handle => {
    try {
      switch (true) {
        // Close standard streams safely
        case handle.fd === 1 || handle.fd === 2:
          console.log(`Closing stdio stream (fd=${handle.fd})`);
          try {
            // Use unref() instead of close() for stdio
            handle.unref?.();
          } catch (e) {
            console.warn(`Error closing stdio: ${e.message}`);
          }
          break;

        // Close Google API sockets
        case handle instanceof tls.TLSSocket:
          console.log(`Closing TLS socket to ${handle.remoteAddress}:${handle.remotePort}`);
          handle.destroy();
          break;

        case handle instanceof net.Socket:
          console.log(`Closing TCP socket to ${handle.remoteAddress}:${handle.remotePort}`);
          handle.destroy();
          break;

        default:
          console.log(`Found open handle: ${handle.constructor.name}`);
          try {
            if (typeof handle.close === 'function') {
              handle.close();
            } else if (typeof handle.destroy === 'function') {
              handle.destroy();
            } else if (handle.unref) {
              handle.unref();
            }
          } catch (e) {
            console.warn(`Error closing handle: ${e.message}`);
          }
      }
    } catch (e) {
      console.warn('Error processing handle:', e);
    }
  });

  // Add Google API specific cleanup
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('Teardown complete. Forcing exit.');
  process.exit(0);
};
