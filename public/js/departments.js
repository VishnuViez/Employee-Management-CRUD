// Departments page: list, create, edit, delete, and view a department's staff.

const form = document.getElementById('dept-form');
const idInput = document.getElementById('dept-id');
const nameInput = document.getElementById('dept-name');
const descInput = document.getElementById('dept-description');
const submitBtn = document.getElementById('dept-submit');
const cancelBtn = document.getElementById('dept-cancel');
const formTitle = document.getElementById('dept-form-title');
const deptList = document.getElementById('dept-list');
const staffTitle = document.getElementById('staff-title');
const staffHint = document.getElementById('staff-hint');
const staffList = document.getElementById('staff-list');

let selectedId = null;

// ---- Read ----
async function loadDepartments() {
    try {
        const departments = await api('/api/departments');
        renderDepartments(departments);
    } catch (err) {
        showMessage(err.message, true);
    }
}

function renderDepartments(departments) {
    deptList.innerHTML = '';
    if (departments.length === 0) {
        deptList.append(el('li', { class: 'empty', text: 'No departments yet.' }));
        return;
    }
    for (const d of departments) {
        const count = `${d.employeeCount} ${d.employeeCount === 1 ? 'employee' : 'employees'}`;
        deptList.append(
            el('li', { class: d._id === selectedId ? 'row selected' : 'row' },
                el('button', { class: 'link', onclick: () => showStaff(d._id) },
                    el('strong', { text: d.name }),
                    el('span', { class: 'meta', text: d.description ? `${d.description} · ${count}` : count })
                ),
                el('div', { class: 'row-actions' },
                    el('button', { class: 'secondary small', onclick: () => startEdit(d), 'aria-label': `Edit ${d.name}` }, 'Edit'),
                    el('button', { class: 'danger small', onclick: () => removeDepartment(d), 'aria-label': `Delete ${d.name}` }, 'Delete')
                )
            )
        );
    }
}

async function showStaff(id) {
    try {
        const { department, employees } = await api(`/api/departments/${id}`);
        selectedId = id;
        staffTitle.textContent = `Staff · ${department.name}`;
        staffHint.textContent = employees.length ? '' : 'No one is assigned to this department yet.';
        staffList.innerHTML = '';
        for (const e of employees) {
            const others = e.departments.filter((d) => d._id !== id).map((d) => d.name);
            staffList.append(
                el('li', { class: 'row' },
                    el('div', {},
                        el('strong', { text: fullName(e) }),
                        el('span', { class: 'meta', text: others.length ? `Also in: ${others.join(', ')}` : '' })
                    )
                )
            );
        }
        loadDepartments(); // refresh the highlight
    } catch (err) {
        showMessage(err.message, true);
    }
}

// ---- Create / Update ----
form.addEventListener('submit', async (event) => {
    event.preventDefault(); // keep the page from reloading
    const name = nameInput.value.trim();
    if (!name) {
        showMessage('Please enter a department name.', true);
        nameInput.focus();
        return;
    }
    const body = { name, description: descInput.value.trim() };
    const id = idInput.value;
    try {
        if (id) {
            await api(`/api/departments/${id}`, { method: 'PUT', body });
            showMessage(`Department "${name}" updated.`);
        } else {
            await api('/api/departments', { method: 'POST', body });
            showMessage(`Department "${name}" added.`);
        }
        resetForm();
        await loadDepartments();
        if (selectedId) showStaff(selectedId);
    } catch (err) {
        showMessage(err.message, true); // e.g. "A record with that name already exists"
    }
});

function startEdit(d) {
    idInput.value = d._id;
    nameInput.value = d.name;
    descInput.value = d.description || '';
    formTitle.textContent = `Edit "${d.name}"`;
    submitBtn.textContent = 'Save changes';
    cancelBtn.hidden = false;
    nameInput.focus();
}

function resetForm() {
    form.reset();
    idInput.value = '';
    formTitle.textContent = 'Add a department';
    submitBtn.textContent = 'Add department';
    cancelBtn.hidden = true;
}
cancelBtn.addEventListener('click', resetForm);

// ---- Delete ----
async function removeDepartment(d) {
    const warning = d.employeeCount
        ? `Delete "${d.name}"? Its ${d.employeeCount} employee(s) will be removed from this department.`
        : `Delete "${d.name}"?`;
    if (!confirm(warning)) return;
    try {
        await api(`/api/departments/${d._id}`, { method: 'DELETE' });
        showMessage(`Department "${d.name}" deleted.`);
        if (selectedId === d._id) {
            selectedId = null;
            staffTitle.textContent = 'Staff';
            staffHint.textContent = 'Select a department to see its staff.';
            staffList.innerHTML = '';
        }
        if (idInput.value === d._id) resetForm();
        loadDepartments();
    } catch (err) {
        showMessage(err.message, true);
    }
}

loadDepartments();
