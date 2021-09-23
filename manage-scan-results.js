$(document).ready(function() {
	getSessionToken();
	createUserSelect();
	createDateTimeSelect("scans", localStorage.getItem('lastLoginUserID'));

	// Load modal.
	var myModal = document.getElementById('delete-scan-modal');
	var myInput = document.getElementById('delete-scan-btn');

	myModal.addEventListener('shown.bs.modal', function () {
		myInput.focus();
	});

	// Activate toasts.
	var toastElList = [].slice.call(document.querySelectorAll('.toast'));
	var toastList = toastElList.map(function (toastEl) {
		return new bootstrap.Toast(toastEl)
	});
});

function getDeleteScanInfo() {
	const scanUser = document.getElementById('user-select').value,
	scanDateTime = document.getElementById('date-time-select').value;

	document.getElementById('chosen-scan-user').innerHTML = scanUser;
	document.getElementById('chosen-scan-datetime').innerHTML = scanDateTime;
}

function deleteScan() {
	const fs = require('fs'),
	scanUser = document.getElementById('user-select').value,
	scanDateTime = document.getElementById('date-time-select').value,
	folderPath = "./scans/" + scanUser + "/" + scanDateTime,
	successToastEle = document.getElementById('delSuccessToast'),
	successToast = bootstrap.Toast.getInstance(successToastEle),
	failToastEle = document.getElementById('delFailToast'),
	failToast = bootstrap.Toast.getInstance(failToastEle);

	// TODO: Test this when getting user lists from db is done.
	// Delete scan folder.
	//const fs = require("fs");
	//fs.rmdirSync(folderPath, { recursive: true });

	// Check if deleted and notify user on results.
	if (!fs.existsSync(folderPath)) {
		// Success.
		successToast.show();
	} else {
		// Failure.
		failToast.show();
	}
}