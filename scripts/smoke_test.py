"""HTTP integration checks. Start the API first; no third-party Python packages needed."""
import json
import sys
import uuid
from urllib.request import Request, urlopen
from urllib.error import HTTPError

BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:5080').rstrip('/')

def request(method, path, payload=None, headers=None):
    data = json.dumps(payload).encode() if payload is not None else None
    headers = dict(headers or {})
    if data is not None:
        headers['Content-Type'] = 'application/json'
    req = Request(BASE + path, data=data, method=method, headers=headers)
    try:
        response = urlopen(req, timeout=15)
    except HTTPError as error:
        response = error
    with response:
        raw = response.read()
        body = json.loads(raw) if raw else None
        return response.status, body, response.headers

def check(condition, message):
    if not condition:
        raise AssertionError(message)
    print('PASS:', message)

product_id = None
try:
    payload = dict(name='Smoke ' + uuid.uuid4().hex[:8], description='Kiểm thử', price=123.45, quantity=2)
    code, product, headers = request('POST', '/api/products', payload)
    check(code == 201, 'POST returns 201')
    product_id = product['id']
    check(headers.get('Location', '').endswith('/api/products/' + str(product_id)), 'POST Location points to product')
    check(product['name'] == payload['name'], 'POST response contains saved values')
    endpoint = '/api/products/' + str(product_id)
    code, products, _ = request('GET', '/api/products')
    check(code == 200 and any(p['id'] == product_id for p in products), 'GET list contains new product')
    code, detail, _ = request('GET', endpoint)
    check(code == 200 and detail['price'] == 123.45, 'GET detail preserves decimal price')
    payload.update(name='Updated smoke', price=456.78, quantity=7)
    code, body, _ = request('PUT', endpoint, payload)
    check(code == 204 and body is None, 'PUT returns 204 with empty body')
    code, detail, _ = request('GET', endpoint)
    check(code == 200 and detail['name'] == payload['name'] and detail['quantity'] == 7 and detail['price'] == 456.78, 'PUT persisted updated values')
    for invalid in [dict(payload, name=''), dict(payload, name='   '), dict(payload, price=-1), dict(payload, quantity=-1), dict(payload, name='x' * 101)]:
        code, body, _ = request('POST', '/api/products', invalid)
        check(code == 400 and 'errors' in body, 'Invalid POST rejected with validation errors')
    code, _, _ = request('PUT', endpoint, dict(payload, quantity=-1))
    check(code == 400, 'Invalid PUT rejected')
    code, detail, _ = request('GET', endpoint)
    check(detail['quantity'] == 7, 'Rejected PUT did not change saved data')
    origin = 'http://localhost:5500'
    code, _, headers = request('OPTIONS', endpoint, headers={'Origin': origin, 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Headers': 'content-type'})
    check(code == 204 and headers.get('Access-Control-Allow-Origin') == origin and 'PUT' in headers.get('Access-Control-Allow-Methods', ''), 'CORS permits frontend PUT preflight')
    code, _, headers = request('GET', '/api/products', headers={'Origin': 'http://example.invalid'})
    check(headers.get('Access-Control-Allow-Origin') is None, 'CORS does not allow an unlisted origin')
    code, body, _ = request('DELETE', endpoint)
    check(code == 204 and body is None, 'DELETE returns 204')
    for method in ['GET', 'PUT', 'DELETE']:
        code, _, _ = request(method, endpoint, payload if method == 'PUT' else None)
        check(code == 404, method + ' deleted product returns 404')
    product_id = None
    print('All HTTP checks passed.')
finally:
    if product_id is not None:
        try:
            request('DELETE', '/api/products/' + str(product_id))
        except Exception:
            print('Cleanup could not complete; remove the smoke product manually.', file=sys.stderr)
