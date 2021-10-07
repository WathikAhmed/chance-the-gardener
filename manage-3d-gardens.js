$(document).ready(async function() {
	getSessionToken();
	createUserSelect();
	await createDateTimeSelect('renders', parseInt(localStorage.getItem('lastLoginUserID')));

	// Activate toasts.
	var toastElList = [].slice.call(document.querySelectorAll('.toast'));
	var toastList = toastElList.map(function (toastEl) {
		return new bootstrap.Toast(toastEl)
	});
});

let renderUserEmailToDel,
renderDateTimeToDel;

function getDeleteRenderInfo() {
	const scanUserToDelSelectEle = document.getElementById('user-select');
	renderUserEmailToDel = scanUserToDelSelectEle[scanUserToDelSelectEle.selectedIndex].text,
	renderDateTimeToDel = document.getElementById('date-time-select').value;

	// Error and stop if no render chosen.
	if (renderDateTimeToDel == 'No renders found for this user') {
		// Show error.
		const noRenderToast = new bootstrap.Toast(document.getElementById('del-no-choice-toast'));
		noRenderToast.show();
	} else {
		document.getElementById('chosen-garden-user').innerHTML = renderUserEmailToDel;
		document.getElementById('chosen-garden-datetime').innerHTML = formatDateTimeReadable(renderDateTimeToDel);
		// Show confirmation modal.
		const delConfModal = new bootstrap.Modal(document.getElementById('delete-render-modal'));
		delConfModal.show();
	}
}

function deleteRender() {
	const successToastEle = document.getElementById('del-success-toast'),
	successToast = bootstrap.Toast.getInstance(successToastEle),
	failToastEle = document.getElementById('del-fail-toast'),
	failToast = bootstrap.Toast.getInstance(failToastEle);
	
	const folderPath = path.join(__dirname, 'garden_viewer', 'FarmBot 3D Viewer_Data', 'Renders', renderUserEmailToDel, renderDateTimeToDel);
	// Delete scan folder.
	fs.rmdirSync(folderPath, { recursive: true });

	// Check if deleted and notify user on results.
	if (!fs.existsSync(folderPath)) {
		// Success.
		successToast.show();
	} else {
		// Failure.
		failToast.show();
	}

	reloadDateTimeSelect('renders');
}