$(document).ready(async function() {
	loggedInCheck();
	getSessionToken();
	createUserSelect();
	createImportUserSelect();
	await createDateTimeSelect('scans', parseInt(localStorage.getItem('lastLoginUserID')));

	// Activate toasts.
	var toastElList = [].slice.call(document.querySelectorAll('.toast'));
	var toastList = toastElList.map(function (toastEl) {
		return new bootstrap.Toast(toastEl)
	});

	// Load modal.
	var myModal = document.getElementById('import-modal');
	var myInput = document.getElementById('import-btn');

	myModal.addEventListener('shown.bs.modal', function () {
		myInput.focus();
	});

	// Set up detecting import filepath.
	$('#import-file-input').change(function (data) {
		const fileToImportInfo = data.target.files[0];
		if (fileToImportInfo === undefined) {
			fileToImportFilepath = undefined;
		} else {
			fileToImportFilepath = fileToImportInfo.path;
		}
	});
});

let scanUserEmailToDel,
scanDateTimeToDel,
scanUserEmailToExport,
scanDateTimeToExport,
fileToImportFilepath;

async function createImportUserSelect() {
	// Create an array of user IDs and their emails from the database.
	var userIDList = await getDbEntireTable('user');

	// Add values to select list.
	const selectList = document.getElementById("import-user-select");
	for (let i = 0; i < userIDList.length; i++) {
		let userOption = document.createElement("option");
		userOption.textContent = userIDList[i].email;
		userOption.value = userIDList[i].userId;
		selectList.appendChild(userOption);
	}
}

function getDeleteScanInfo() {
	const scanUserToDelSelectEle = document.getElementById('user-select');
	scanUserEmailToDel = scanUserToDelSelectEle[scanUserToDelSelectEle.selectedIndex].text,
	scanDateTimeToDel = document.getElementById('date-time-select').value;

	// Error and stop if no scan chosen.
	if (scanDateTimeToDel == 'No scans found for this user') {
		// Show error.
		const noScanToast = new bootstrap.Toast(document.getElementById('scan-no-choice-toast'));
		noScanToast.show();
	} else {
		document.getElementById('chosen-scan-user').innerHTML = scanUserEmailToDel;
		document.getElementById('chosen-scan-datetime').innerHTML = formatDateTimeReadable(scanDateTimeToDel);
		// Show confirmation modal.
		const delConfModal = new bootstrap.Modal(document.getElementById('delete-scan-modal'));
		delConfModal.show();
	}
}

function deleteScan() {
	const successToastEle = document.getElementById('del-success-toast'),
	successToast = bootstrap.Toast.getInstance(successToastEle),
	failToastEle = document.getElementById('del-fail-toast'),
	failToast = bootstrap.Toast.getInstance(failToastEle);

	const scanFolderPath = path.join(__dirname, 'scans', scanUserEmailToDel, scanDateTimeToDel),
	thumbsFolderPath = path.join(__dirname, 'thumbs', scanUserEmailToDel, scanDateTimeToDel);
	// Delete scan and thumbs folders.
	fs.rmdirSync(scanFolderPath, { recursive: true });
	fs.rmdirSync(thumbsFolderPath, { recursive: true });

	// Check if deleted and notify user on results.
	if ((!fs.existsSync(scanFolderPath)) && (!fs.existsSync(thumbsFolderPath))) {
		// Success.
		successToast.show();
	} else {
		// Failure.
		failToast.show();
	}

	reloadDateTimeSelect('scans');
}

async function loadPhotoViewer() {
	// Get the scan folder.
	const scanDateTime = document.getElementById('date-time-select').value;
	// Get user's email from db.
	const selectedUserId = parseInt(document.getElementById('user-select').value),
	currentUserObj = {userId: selectedUserId},
	userCreds = await getDbRowWhere('user', currentUserObj),
	emailAdd = userCreds[0].email;

	const folderPaths = [(path.join(__dirname, 'scans', emailAdd, scanDateTime)), (path.join(__dirname, 'thumbs', emailAdd, scanDateTime))];

	// Store which folder to view.
	localStorage.setItem("photosToView", JSON.stringify(folderPaths));

	changePage("view-scan-photos.html");
}

async function loadPlantDataViewer() {
	// Get the scan folder.
	const scanDateTime = document.getElementById('date-time-select').value;
	// Get user's email from db.
	const selectedUserId = parseInt(document.getElementById('user-select').value),
	currentUserObj = {userId: selectedUserId},
	userCreds = await getDbRowWhere('user', currentUserObj),
	emailAdd = userCreds[0].email;

	const folderPath = path.join(__dirname, 'scans', emailAdd, scanDateTime);

	// Store which folder to view.
	localStorage.setItem("plantDataToView", JSON.stringify(folderPath));

	changePage("view-scan-plant-data.html");
}

function getExportScanInfo() {
	const scanUserToExportSelectEle = document.getElementById('user-select');
	scanUserEmailToExport = scanUserToExportSelectEle[scanUserToExportSelectEle.selectedIndex].text,
	scanDateTimeToExport = document.getElementById('date-time-select').value;

	// Error and stop if no render chosen.
	if (scanDateTimeToExport == 'No scans found for this user') {
		// Show error.
		const noScanToast = new bootstrap.Toast(document.getElementById('scan-no-choice-toast'));
		noScanToast.show();
	} else {
		document.getElementById('chosen-scan-export-user').innerHTML = scanUserEmailToExport;
		document.getElementById('chosen-scan-export-datetime').innerHTML = formatDateTimeReadable(scanDateTimeToExport);
		const exportFileName = 'Scan_' + scanUserEmailToExport + '_' + scanDateTimeToExport + '.zip',
		exportPath = path.join(__dirname, 'exports', exportFileName);
		document.getElementById('export-scan-path').innerHTML = exportPath;

		// Show confirmation modal.
		const exportConfModal = new bootstrap.Modal(document.getElementById('export-scan-modal'));
		exportConfModal.show();
	}
}

function exportScan() {
	const archiver = require('archiver');

	const successToastEle = document.getElementById('export-success-toast'),
	successToast = bootstrap.Toast.getInstance(successToastEle),
	failToastEle = document.getElementById('export-fail-toast'),
	failToast = bootstrap.Toast.getInstance(failToastEle),
	loadingSpinner = document.getElementById('export-progress-spinner'),
	buttons = document.getElementsByClassName('btn'),
	scanUserSelect = document.getElementById('user-select'),
	scanDateTimeSelect = document.getElementById('date-time-select');

	const scanFolderPath = path.join(__dirname, 'scans', scanUserEmailToExport, scanDateTimeToExport),
	thumbsFolderPath = path.join(__dirname, 'thumbs', scanUserEmailToExport, scanDateTimeToExport),
	exportFileName = 'Scan_' + scanUserEmailToExport + '_' + scanDateTimeToExport + '.zip',
	exportPath = path.join(__dirname, 'exports', exportFileName);

	// Show loading spinner.
	loadingSpinner.classList.remove("d-none");

	// Disable buttons.
	for (let i = 0; i < buttons.length; i++) {
		buttons[i].setAttribute("disabled", "");
	}

	// Disable drop-downs.
	scanUserSelect.setAttribute("disabled", "");
	scanDateTimeSelect.setAttribute("disabled", "");

	// Check if exports folder exists yet, and create if not.
	if (!fs.existsSync(path.join(__dirname, 'exports'))) {
		fs.mkdirSync(path.join(__dirname, 'exports'));
	}

	// TODO: Handle export already existing.

	// Create a .zip file to stream data to.
	const output = fs.createWriteStream(exportPath);
	const archive = archiver('zip', {
	zlib: { level: 9 } // Sets the compression level.
	});

	// Wait for finish.
	output.on('close', function() {
		log.info(archive.pointer() + ' total bytes');
		log.info('archiver has been finalized and the output file descriptor has closed.');

		// Success toast.
		successToast.show();

		// Hide loading spinner.
		loadingSpinner.classList.add("d-none");

		// Enable buttons.
		for (let i = 0; i < buttons.length; i++) {
			buttons[i].removeAttribute("disabled");
		}

		// Enable drop-downs.
		scanUserSelect.removeAttribute("disabled");
		scanDateTimeSelect.removeAttribute("disabled");
	});

	archive.on('warning', function(err) {
		if (err.code === 'ENOENT') {
			log.error(err);

			failToast.show();

			// Hide loading spinner.
			loadingSpinner.classList.add("d-none");

			// Enable buttons.
			for (let i = 0; i < buttons.length; i++) {
				buttons[i].removeAttribute("disabled");
			}

			// Enable drop-downs.
			scanUserSelect.removeAttribute("disabled");
			scanDateTimeSelect.removeAttribute("disabled");
		} else {
			log.error(err);

			failToast.show();

			// Hide loading spinner.
			loadingSpinner.classList.add("d-none");

			// Enable buttons.
			for (let i = 0; i < buttons.length; i++) {
				buttons[i].removeAttribute("disabled");
			}

			// Enable drop-downs.
			scanUserSelect.removeAttribute("disabled");
			scanDateTimeSelect.removeAttribute("disabled");

			throw err;
		}
	});

	archive.on('error', function(err) {
		log.error(err);

		failToast.show();

		// Hide loading spinner.
		loadingSpinner.classList.add("d-none");

		// Enable buttons.
		for (let i = 0; i < buttons.length; i++) {
			buttons[i].removeAttribute("disabled");
		}

		// Enable drop-downs.
		scanUserSelect.removeAttribute("disabled");
		scanDateTimeSelect.removeAttribute("disabled");

		throw err;
	});

	// Pipe data to the .zip file
	archive.pipe(output);

	// Append files from a the chosen scan and its thumbs folders.
	archive.directory(scanFolderPath, path.join('scans', scanUserEmailToExport, scanDateTimeToExport));
	archive.directory(thumbsFolderPath, path.join('thumbs', scanUserEmailToExport, scanDateTimeToExport));

	archive.finalize();
}

// TODO: Hide/show loading spinner.
async function importScanRender() {
	const StreamZip = require('node-stream-zip');

	if (fileToImportFilepath === undefined) {
		// TODO: Error nothing chosen
		log.error('No file chosen for import.');
		return;
	}

	// Open the import zip.
	const zip = new StreamZip.async({ file: fileToImportFilepath });
	const zipContents = await zip.entries();

	// Get path of first file in zip, and then import type based on that.
	firstFilePath = Object.keys(zipContents)[0],
	importType = firstFilePath.split('/')[0];

	// Grab email from import.
	let importEmail;
	if (importType == 'scans' || importType == 'thumbs') {
		log.info('This is a scan!');
		importEmail = firstFilePath.split('/')[1];
	} else if (importType == 'garden_viewer') {
		log.info('This is a garden render!');
		importEmail = firstFilePath.split('/')[4];
	} else {
		// TODO: Error.
		log.error('Invalid import');
		return;
	}

	// Check if email exists in db.
	const newUserEmailObj = {email: importEmail},
	matchingUser = await getDbRowWhere('user', newUserEmailObj);

	// Ask to merge if no match, otherwise do it automatically.
	if (matchingUser.length == 0) {
		// If no matching email, ask if they want to merge with an existing user.
		const mergeModal = new bootstrap.Modal(document.getElementById('merge-import-modal'));
		mergeModal.show();
		// Close zip.
		await zip.close();
	} else {
		// Extract the files.
		await zip.extract(null, __dirname);
		// Close zip.
		await zip.close();
		// TODO: Toast import complete.
	}
}

async function normalImport() {
	const StreamZip = require('node-stream-zip');

	// Open the import zip.
	const zip = new StreamZip.async({ file: fileToImportFilepath });

	// Extract the files.
	await zip.extract(null, __dirname);
	// Close zip.
	await zip.close();

	// Grab email from import.
	let importEmail;
	if (importType == 'scans' || importType == 'thumbs') {
		importEmail = firstFilePath.split('/')[1];
	} else if (importType == 'garden_viewer') {
		importEmail = firstFilePath.split('/')[4];
	}
	log.info('importEmail: ' + importEmail);

	// Create new user entry in db.
	const newUserCredsObj = {email: importEmail, password: ''};
	await addDbTableRow('user', newUserCredsObj);

	log.info('import...done??');
	// TODO: Toast import complete.
}

async function mergeImport() {
	const StreamZip = require('node-stream-zip');

	// Grab which existing user to merge into.
	const renderUserToMergeImportSelectEle = document.getElementById('import-user-select'),
	renderUserEmailToMergeImport = renderUserToMergeImportSelectEle[renderUserToMergeImportSelectEle.selectedIndex].text;

	// Open the import zip.
	const zip = new StreamZip.async({ file: fileToImportFilepath });
	const zipContents = await zip.entries();

	if (importType == 'scans' || importType == 'thumbs') {
		let importEmail = firstFilePath.split('/')[1];

		// Check if scans & thumbs folders exist yet, and create if not.
		if (!fs.existsSync(path.join(__dirname, 'scans'))) {
			fs.mkdirSync(path.join(__dirname, 'scans'));
		}
		if (!fs.existsSync(path.join(__dirname, 'thumbs'))) {
			fs.mkdirSync(path.join(__dirname, 'thumbs'));
		}

		if (!fs.existsSync(path.join(__dirname, 'scans', renderUserEmailToMergeImport))) {
			fs.mkdirSync(path.join(__dirname, 'scans', renderUserEmailToMergeImport));
		}
		if (!fs.existsSync(path.join(__dirname, 'thumbs', renderUserEmailToMergeImport))) {
			fs.mkdirSync(path.join(__dirname, 'thumbs', renderUserEmailToMergeImport));
		}

		// Extract the files.
		await zip.extract('scans/' + importEmail, path.join(__dirname, 'scans', renderUserEmailToMergeImport));
		await zip.extract('thumbs/' + importEmail, path.join(__dirname, 'thumbs', renderUserEmailToMergeImport));
	} else if (importType == 'garden_viewer') {
		let importEmail = firstFilePath.split('/')[4];

		// Check if renders folders exist yet, and create if not.
		if (!fs.existsSync(path.join(__dirname, 'garden_viewer', 'FarmBot 3D Viewer_Data', 'FarmBotData'))) {
			fs.mkdirSync(path.join(__dirname, 'garden_viewer', 'FarmBot 3D Viewer_Data', 'FarmBotData'));
		}

		if (!fs.existsSync(path.join(__dirname, 'garden_viewer', 'FarmBot 3D Viewer_Data', 'FarmBotData', 'Renders'))) {
			fs.mkdirSync(path.join(__dirname, 'garden_viewer', 'FarmBot 3D Viewer_Data', 'FarmBotData', 'Renders'));
		}

		if (!fs.existsSync(path.join(__dirname, 'garden_viewer', 'FarmBot 3D Viewer_Data', 'FarmBotData', 'Renders', renderUserEmailToMergeImport))) {
			fs.mkdirSync(path.join(__dirname, 'garden_viewer', 'FarmBot 3D Viewer_Data', 'FarmBotData', 'Renders', renderUserEmailToMergeImport));
		}

		// Extract the files.
		await zip.extract('garden_viewer/FarmBot 3D Viewer_Data/FarmBotData/Renders/' + importEmail, path.join(__dirname, 'garden_viewer', 'FarmBot 3D Viewer_Data', 'FarmBotData', 'Renders', renderUserEmailToMergeImport));
	}

	// Close zip.
	await zip.close();
	// TODO: Toast import complete.
}

function showImportMergeConfirmationModal() {
	const mergeModal = new bootstrap.Modal(document.getElementById('merge-import-process-modal'));
	mergeModal.show();
}

function backToImportPrompt() {
	const mergeModal = new bootstrap.Modal(document.getElementById('merge-import-modal'));
	mergeModal.show();
}