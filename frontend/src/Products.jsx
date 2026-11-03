import React, { useEffect, useState } from 'react';
import { productApi, errorText } from './api';
const empty = { name: '', description: '', price: '', quantity: '' };
const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
export function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  function reset() { setForm(empty); setEditingId(null); }
  async function load() { const { data } = await productApi.getAll(); setProducts(data); }
  async function run(action) {
    if (busy) return;
    setBusy(true); setMessage(''); setFailed(false);
    try { await action(); } catch (error) { setFailed(true); setMessage(errorText(error)); }
    finally { setBusy(false); }
  }
  useEffect(() => { run(load); }, []);
  function update(event) { setForm({ ...form, [event.target.name]: event.target.value }); }
  function save(event) {
    event.preventDefault();
    if (!form.name.trim()) { setFailed(true); setMessage('Vui lòng nhập tên sản phẩm.'); return; }
    run(async () => {
      const payload = { ...form, name: form.name.trim(), description: form.description.trim() || null, price: Number(form.price), quantity: Number(form.quantity) };
      if (editingId) await productApi.update(editingId, payload); else await productApi.create(payload);
      reset(); await load(); setMessage('Đã lưu sản phẩm thành công.');
    });
  }
  return <>
    {message && <p className={`notice ${failed ? 'error' : 'success'}`} role={failed ? 'alert' : 'status'}>{message}</p>}
    <section className="layout" aria-busy={busy}><form onSubmit={save}><h2>{editingId ? `Sửa sản phẩm #${editingId}` : 'Thêm sản phẩm'}</h2><fieldset disabled={busy}>
      <label htmlFor="name">Tên sản phẩm</label><input id="name" name="name" value={form.name} onChange={update} maxLength={100} required />
      <label htmlFor="description">Mô tả</label><textarea id="description" name="description" value={form.description} onChange={update} maxLength={500} rows={3} />
      <label htmlFor="price">Giá (VNĐ)</label><input id="price" name="price" type="number" min="0" max="1000000000" step="0.01" value={form.price} onChange={update} required />
      <label htmlFor="quantity">Số lượng</label><input id="quantity" name="quantity" type="number" min="0" max="1000000" step="1" value={form.quantity} onChange={update} required />
      <div className="actions"><button type="submit">{busy ? 'Đang xử lý…' : editingId ? 'Lưu thay đổi' : 'Thêm sản phẩm'}</button><button type="button" className="secondary" onClick={reset}>Làm mới form</button></div>
    </fieldset></form>
    <section className="card"><div className="list-heading"><h2>Danh sách sản phẩm</h2><button disabled={busy} className="secondary" onClick={() => run(load)}>Tải lại</button></div>
      <div className="scroll"><table><thead><tr><th>ID</th><th>Sản phẩm</th><th>Giá</th><th>Số lượng</th><th>Thao tác</th></tr></thead><tbody>
        {!products.length && <tr><td colSpan={5}>{busy ? 'Đang tải dữ liệu…' : 'Chưa có sản phẩm.'}</td></tr>}
        {products.map(product => <tr key={product.id}><td>{product.id}</td><td title={product.description || ''}>{product.name}</td><td>{money.format(product.price)}</td><td>{product.quantity}</td><td>
          <button disabled={busy} className="secondary" onClick={() => run(async () => { const { data } = await productApi.getById(product.id); setEditingId(data.id); setForm({ ...data, description: data.description || '' }); })}>Sửa</button>
          <button disabled={busy} className="danger" onClick={() => { if (window.confirm(`Xóa sản phẩm "${product.name}"?`)) run(async () => { await productApi.remove(product.id); if (editingId === product.id) reset(); await load(); setMessage('Đã xóa sản phẩm.'); }); }}>Xóa</button>
        </td></tr>)}
      </tbody></table></div>
    </section></section>
  </>;
}
