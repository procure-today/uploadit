//    const vision = require('@google-cloud/vision')({
//         projectId: "pid",
//         keyfileName: 'keyfile.json'
//     });


    // The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
    const functions = require('firebase-functions');

    // // The Firebase Admin SDK to access the Firebase Realtime Database.
    // const admin = require('firebase-admin');
    // admin.initializeApp();
    // // Create the Firebase reference to store our image data
    // const db = admin.database();
    const { Storage } = require('@google-cloud/storage');
    // Your Google Cloud Platform project ID                                        
    // const projectId = 'pid';

    // Creates a client                                                             
    const storage = new Storage();
    /**
     * Parses a 'multipart/form-data' upload request
     *
     * @param {Object} req Cloud Function request context.
     * @param {Object} res Cloud Function response context.
     */
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    // Node.js doesn't have a built-in multipart/form-data parsing library.
    // Instead, we can use the 'busboy' library from NPM to parse these requests.
    const Busboy = require('busboy');

    exports.upload = functions.https.onRequest((req, res) => {
        if (req.method !== 'POST') {
            // Return a "method not allowed" error
            return res.status(405).end();
        }
        const busboy = new Busboy({ headers: req.headers });
        const tmpdir = os.tmpdir();

        // This object will accumulate all the fields, keyed by their name
        const fields = {};

        // This object will accumulate all the uploaded files, keyed by their name.
        const uploads = {};

        // This code will process each non-file field in the form.
        busboy.on('field', (fieldname, val) => {
            // TODO(developer): Process submitted field values here
            console.log(`Processed field ${fieldname}: ${val}.`);
            fields[fieldname] = val;
        });

        const fileWrites = [];

        // This code will process each file uploaded.
        busboy.on('file', (fieldname, file, filename) => {
            // Note: os.tmpdir() points to an in-memory file system on GCF
            // Thus, any files in it must fit in the instance's memory.
            console.log(`Processed file ${filename}`);

            const filepath = path.join(tmpdir, filename);
            uploads[fieldname] = filepath;

            const writeStream = fs.createWriteStream(filepath);
            file.pipe(writeStream);

            // File was processed by Busboy; wait for it to be written to disk.
            const promise = new Promise((resolve, reject) => {
                file.on('end', () => {
                    writeStream.end();
                });
                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
            });
            fileWrites.push(promise);
        });

        // Triggered once all uploaded files are processed by Busboy.
        // We still need to wait for the disk writes (saves) to complete.
        busboy.on('finish', () => {
            Promise.all(fileWrites).then(() => {
                // TODO(developer): Process saved files here
                for (const name in uploads) {
                    const file = uploads[name];
                    async function upload2bucket() {
                        var bucketName = 'bname'
                        fileRes = await storage.bucket(bucketName).upload(file);
                        fs.unlinkSync(file);
                        console.log('fileRes',fileRes)
                        console.log(`Finish: Processed file ${file}`);
                        res.send(fileRes);
                    }
                    upload2bucket()
                }
            });
        });

        busboy.end(req.rawBody);

    });