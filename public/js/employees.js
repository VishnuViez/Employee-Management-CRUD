// Employees page: list (with department filter), create, edit, delete,
// and assign / remove departments.

const form = document.getElementById('emp-form');
const idInput = document.getElementById('emp-id');
const firstInput = document.getElementById('emp-first');
const lastInput = document.getElementById('emp-last');
const deptChecks = document.getElementById('emp-depts');
const submitBtn = document.getElementById('emp-submit');
const cancelBtn = document.getElementById('emp-cancel');
const formTitle = document.getElementById('emp-form-title');
const filterSelect = document.getElementById('filter');
const rows = document.getElementById('emp-rows');

let departments = []; // cached list, used for checkboxes, filter and "assign" menus

// ---- Read ----
async function loadDepartments() {
    departments = await api('/api/departments');

    // Checkboxes in the form (keep whatever is ticked)
    const ticked = new Set(selectedDepartmentIds());
    deptChecks.innerHTML = '';
    if (departments.length === 0) {
        deptChecks.append(el('p', { class: 'hint', text: 'No departments yet. Add one on the Departments page.' }));
    }
    for (const d of departments) {
        const input = el('input', { type: 'checkbox', value: d._id, id: `chk-${d._id}` });
        input.checked = ticked.has(d._id);
        deptChecks.append(el('label', { class: 'check', for: `chk-${d._id}` }, input, d.name));
    }

    // Filter menu (keep the current choice)
    const current = filterSelect.value;
    filterSelect.innerHTML = '';
    filterSelect.append(el('option', { value: '', text: 'All departments' }));
    for (const d of departments) filterSelect.append(el('option', { value: d._id, text: d.name }));
    filterSelect.value = departments.some((d) => d._id === current) ? current : '';
}

async function loadEmployees() {
    try {
        const query = filterSelect.value ? `?department=${filterSelect.value}` : '';
        const employees = await api(`/api/employees${query}`);
        renderEmployees(employees);
    } catch (err) {
        showMessage(err.message, true);
    }
}

function renderEmployees(employees) {
    rows.innerHTML = '';
    if (employees.length === 0) {
        rows.append(el('tr', {}, el('td', { colspan: '3', class: 'empty', text: 'No employees to show.' })));
        return;
    }
    for (const e of employees) {
        // One chip per department, each with a × to remove the employee from it.
        const chips = el('div', { class: 'chips' });
        for (const d of e.departments) {
            chips.append(
                el('span', { class: 'chip' }, d.name,
                    el('button', {
                        class: 'chip-x',
                        title: `Remove from ${d.name}`,
                        'aria-label': `Remove ${fullName(e)} from ${d.name}`,
                        onclick: () => unassign(e, d),
                    }, '×')
                )
            );
        }
        if (e.departments.length === 0) chips.append(el('span', { class: 'hint', text: 'No department' }));

        // "Assign to…" menu listing only departments the employee is not in yet.
        const mine = new Set(e.departments.map((d) => d._id));
        const available = departments.filter((d) => !mine.has(d._id));
        if (available.length) {
            const select = el('select', { class: 'assign', 'aria-label': `Assign ${fullName(e)} to a department` },
                el('option', { value: '', text: '+ Assign to…' }),
                ...available.map((d) => el('option', { value: d._id, text: d.name }))
            );
            select.addEventListener('change', () => select.value && assign(e, select.value));
            chips.append(select);
        }

        rows.append(
            el('tr', {},
                el('td', {}, el('strong', { text: fullName(e) })),
                el('td', {}, chips),
                el('td', {},
                    el('div', { class: 'row-actions' },
                        el('button', { class: 'secondary small', onclick: () => startEdit(e), 'aria-label': `Edit ${fullName(e)}` }, 'Edit'),
                        el('button', { class: 'danger small', onclick: () => removeEmployee(e), 'aria-label': `Delete ${fullName(e)}` }, 'Delete')
                    )
                )
            )
        );
    }
}

filterSelect.addEventListener('change', loadEmployees);

// ---- Create / Update ----
function selectedDepartmentIds() {
    return [...deptChecks.querySelectorAll('input:checked')].map((i) => i.value);
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const firstName = firstInput.value.trim();
    const lastName = lastInput.value.trim();
    if (!firstName || !lastName) {
        showMessage('Please enter both a first and a last name.', true);
        (firstName ? lastInput : firstInput).focus();
        return;
    }
    const body = { firstName, lastName, departments: selectedDepartmentIds() };
    const id = idInput.value;
    try {
        if (id) {
            await api(`/api/employees/${id}`, { method: 'PUT', body });
            showMessage(`${firstName} ${lastName} updated.`);
        } else {
            await api('/api/employees', { method: 'POST', body });
            showMessage(`${firstName} ${lastName} added.`);
        }
        resetForm();
        loadEmployees();
    } catch (err) {
        showMessage(err.message, true);
    }
});

function startEdit(e) {
    idInput.value = e._id;
    firstInput.value = e.firstName;
    lastInput.value = e.lastName;
    const mine = new Set(e.departments.map((d) => d._id));
    for (const box of deptChecks.querySelectorAll('input')) box.checked = mine.has(box.value);
    formTitle.textContent = `Edit ${fullName(e)}`;
    submitBtn.textContent = 'Save changes';
    cancelBtn.hidden = false;
    firstInput.focus();
}

function resetForm() {
    form.reset();
    idInput.value = '';
    formTitle.textContent = 'Add an employee';
    submitBtn.textContent = 'Add employee';
    cancelBtn.hidden = true;
}
cancelBtn.addEventListener('click', resetForm);

// ---- Assign / remove department ----
async function assign(e, deptId) {
    try {
        const updated = await api(`/api/employees/${e._id}/departments/${deptId}`, { method: 'POST' });
        const name = departments.find((d) => d._id === deptId)?.name;
        showMessage(`${fullName(updated)} assigned to ${name}.`);
        loadEmployees();
    } catch (err) {
        showMessage(err.message, true);
    }
}

async function unassign(e, d) {
    try {
        await api(`/api/employees/${e._id}/departments/${d._id}`, { method: 'DELETE' });
        showMessage(`${fullName(e)} removed from ${d.name}.`);
        loadEmployees();
    } catch (err) {
        showMessage(err.message, true);
    }
}

// ---- Delete ----
async function removeEmployee(e) {
    if (!confirm(`Delete ${fullName(e)}? This cannot be undone.`)) return;
    try {
        await api(`/api/employees/${e._id}`, { method: 'DELETE' });
        showMessage(`${fullName(e)} deleted.`);
        if (idInput.value === e._id) resetForm();
        loadEmployees();
    } catch (err) {
        showMessage(err.message, true);
    }
}

// Start: departments first (needed for menus), then the staff list.
loadDepartments()
    .then(loadEmployees)
    .catch((err) => showMessage(err.message, true));
