/* Các request đều đi qua Axios. Chỉ đổi baseURL nếu bạn đổi cổng backend. */
const api = axios.create({ baseURL: 'http://localhost:5080/api', timeout: 10000 });
const productApi = {
  getAll: () => api.get('/products'),
  getById: id => api.get(`/products/${id}`),
  create: data => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  remove: id => api.delete(`/products/${id}`)
};

const $ = id => document.getElementById(id);
let editingId = null;
let busy = false;
const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
function status(message, error = false) {
  $('status').textContent = message;
  $('status').className = error ? 'error' : 'success';
}
function errorText(error) {
  if (!error.response) return 'Không kết nối được API. Kiểm tra backend cổng 5080 và CORS.';
  const data = error.response.data;
  const details = data?.errors ? Object.values(data.errors).flat().join(' ') : data?.message || data?.title;
  return `HTTP ${error.response.status}: ${details || 'Có lỗi xảy ra.'}`;
}
function resetForm() {
  editingId = null;
  $('product-form').reset();
  $('form-title').textContent = 'Thêm sản phẩm';
  $('save').textContent = 'Thêm sản phẩm';
}
function setBusy(value) {
  busy = value;
  document.querySelectorAll('button').forEach(button => button.disabled = value);
  document.querySelectorAll('input,textarea').forEach(input => input.disabled = value);
}
async function run(action) {
  if (busy) return;
  setBusy(true);
  try { await action(); } catch (error) { status(errorText(error), true); }
  finally { setBusy(false); }
}
async function loadProducts() {
  const { data } = await productApi.getAll(); // GET danh sách
  const body = $('products');
  body.replaceChildren();
  if (data.length === 0) {
    const cell = body.insertRow().insertCell(); cell.colSpan = 5;
    cell.textContent = 'Chưa có sản phẩm. Hãy thêm sản phẩm đầu tiên.';
  }
  data.forEach(product => {
    const row = body.insertRow();
    [product.id, product.name, money.format(product.price), product.quantity].forEach(value => {
      row.insertCell().textContent = String(value); // Không đưa dữ liệu người dùng vào innerHTML.
    });
    row.cells[1].title = product.description || '';
    const actions = row.insertCell();
    const edit = document.createElement('button');
    edit.textContent = 'Sửa'; edit.className = 'secondary';
    edit.addEventListener('click', () => run(async () => {
      const { data: detail } = await productApi.getById(product.id); // GET theo ID
      editingId = detail.id;
      ['name', 'description', 'price', 'quantity'].forEach(key => $(key).value = detail[key] ?? '');
      $('form-title').textContent = `Sửa sản phẩm #${editingId}`;
      $('save').textContent = 'Lưu thay đổi';
      status(`GET thành công sản phẩm #${editingId}. Sửa thông tin rồi bấm Lưu.`);
    }));
    const remove = document.createElement('button');
    remove.textContent = 'Xóa'; remove.className = 'danger';
    remove.addEventListener('click', () => {
      if (!confirm(`Xóa sản phẩm "${product.name}"?`)) return;
      run(async () => {
        await productApi.remove(product.id); // DELETE
        if (editingId === product.id) resetForm();
        await loadProducts();
        status('DELETE thành công — HTTP 204. Đã tải lại danh sách.');
      });
    });
    actions.append(edit, remove);
  });
}
$('product-form').addEventListener('submit', event => {
  event.preventDefault();
  const payload = {
    name: $('name').value.trim(), description: $('description').value.trim() || null,
    price: Number($('price').value), quantity: Number($('quantity').value)
  };
  if (!payload.name) { status('Vui lòng nhập tên sản phẩm.', true); return; }
  run(async () => {
    const updating = editingId !== null;
    if (updating) await productApi.update(editingId, payload); // PUT
    else await productApi.create(payload); // POST
    resetForm();
    await loadProducts();
    status(updating ? 'PUT thành công — HTTP 204. Đã lưu thay đổi.' : 'POST thành công — HTTP 201. Đã thêm sản phẩm.');
  });
});
$('cancel').addEventListener('click', resetForm);
$('reload').addEventListener('click', () => run(async () => {
  await loadProducts(); status('GET thành công — HTTP 200. Đã tải lại danh sách.');
}));
run(async () => { await loadProducts(); status('Kết nối thành công. Sẵn sàng thêm sản phẩm.'); });
