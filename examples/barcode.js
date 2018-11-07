/**
 * .barcode(), autocomplete and backward() methods example
 * Here we set the barcode. To see all the results, you can
 * both unzip .pkpass file or check the properties before
 * generating the whole bundle
 *
 * Pass ?alt=true as querystring to test a barcode generate
 * by a string
 */

const app = require("./webserver");
const { Pass } = require("..");

app.all(function manageRequest(request, response) {

	let passName = request.params.modelName + "_" + (new Date()).toISOString().split('T')[0].replace(/-/ig, "");

	let pass = new Pass({
		model: `./models/${request.params.modelName}`,
		certificates: {
			wwdr: "../certificates/WWDR.pem",
			signerCert: "../certificates/signerCert.pem",
			signerKey: {
				keyFile: "../certificates/signerKey.pem",
				passphrase: "123456"
			}
		},
		overrides: request.body || request.params || request.query,
	});

	let bc;

	if (request.query.alt === true) {
		// After this, pass.props["barcodes"] will have support for all the formats
		// while pass.props["barcode"] will be the first of barcodes.

		bc = pass.barcode("Thank you for using this package <3");
	} else {
		// After this, pass.props["barcodes"] will have support for just two of three
		// of the passed format (the valid ones) and pass.props["barcode"] the first of barcodes.
		// if not specified, altText is automatically the message

		bc = pass.barcode([{
			message: "Thank you for using this package <3",
			format: "PKBarcodeFormatCode128"
		}, {
			message: "Thank you for using this package <3",
			format: "PKBarcodeFormatPDF417"
		}, {
			message: "Thank you for using this package <3",
			format: "PKBarcodeFormatMock44617"
		}]);
	}

	// You can change the format chosen for barcode prop support by calling .backward()
	// or cancel the support by calling empty .backward
	// like bc.backward().
	// If the property passed does not exists, things does not change.

	bc.backward("PKBarcodeFormatPDF417");

	// If your barcode structures got not autogenerated yet (as happens with string
	// parameter of barcode) you can call .autocomplete() to generate the support
	// to all the structures. Please beware that this will overwrite ONLY barcodes and not barcode.

	if (!request.query.alt) {
		// String generated barcode returns autocomplete as empty function
		bc.autocomplete();
	}

	console.log("Barcode property is now:", pass._props["barcode"]);
	console.log("Barcodes support is autocompleted:", pass._props["barcodes"]);

	pass.generate().then(function (stream) {
		response.set({
			"Content-type": "application/vnd.apple.pkpass",
			"Content-disposition": `attachment; filename=${passName}.pkpass`
		});

		stream.pipe(response);
	}).catch(err => {

		console.log(err);

		response.set({
			"Content-type": "text/html",
		});

		response.send(err.message);
	});
});
