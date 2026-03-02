# Treasury Prototype: Оформление безналичных платежей

Локальный монорепозиторий с **backend** (Node.js + Express + TypeScript) и **frontend** (React + Vite + TypeScript + React Router). Все данные хранятся **in-memory** (без БД и без файлового хранения).

## Запуск из коробки

1. Установите зависимости:
   ```bash
   npm install
   ```
2. Скопируйте переменные окружения из `.env.example` при необходимости.
3. Запустите оба сервиса из корня:
   ```bash
   npm run dev
   ```

Адреса:
- backend: http://localhost:3001
- frontend: http://localhost:5173

## Переменные окружения

См. `.env.example`:
- `PORT=3001` для backend
- `VITE_API_URL=http://localhost:3001` для frontend

## Роли и упрощенный логин

- `INITIATOR` — создает платежи, отправляет, правит после возврата.
- `TREASURER` — берет в работу, возвращает, запускает auto-check, отправляет в банк.
- `CFO` — approve/reject для маршрута согласования.
- `ADMIN` — управляет справочниками и может принимать bank callback.

Логин без пароля:
- `GET /api/auth/users`
- `POST /api/auth/login { userId }` -> `{ token, user }`

## Правила маршрутизации (rulesEngine)

`POST /api/payments/:id/auto-check`:
1. Проверка обязательных полей и реквизитов контрагента (`iban` + `bik`) + минимум 1 вложение типа `INVOICE`/`CONTRACT`.
2. Проверка blacklist.
3. Проверка лимитов в порядке приоритета: `BY_INITIATOR` -> `BY_BUDGET_ITEM` -> `GLOBAL`.
4. Проверка дубликата за 60 минут.

Результат:
- `NEEDS_FIX` при `missingFields`
- `NEEDS_APPROVAL` при risk/limit/duplicate
- `APPROVED` иначе

Выбор по blacklist: используется `NEEDS_APPROVAL`, чтобы CFO мог финально принять решение (а не автo-отклонение).

## Seed данные

При старте backend:
- 4 пользователя (INITIATOR/TREASURER/CFO/ADMIN)
- 3 контрагента (1 с неполными реквизитами, 1 в blacklist)
- 5 статей бюджета
- лимиты: GLOBAL 50k RUB, BY_BUDGET_ITEM (Капзатраты) 10k RUB, BY_INITIATOR 30k RUB

## Сценарий проверки

1. Войти как `INITIATOR` -> создать платеж -> добавить вложение -> `Submit`.
2. Войти как `TREASURER` -> взять в работу -> `Auto-check`.
3. Если `NEEDS_APPROVAL`, войти как `CFO` -> approve/reject.
4. Вернуться как `TREASURER` -> `send-to-bank`.
5. Выполнить `bank-callback` как `TREASURER` или `ADMIN`.

## Основные API

- Auth: `/api/auth/*`
- Справочники (ADMIN): `/api/counterparties`, `/api/budget-items`, `/api/blacklist`, `/api/limits`
- Платежи: `/api/payments/*`
- Согласование: `/api/approvals/pending`
- Отчеты: `/api/reports/queue`, `/api/reports/quality`, `/api/reports/sla`

Единый формат ошибки:
```json
{ "error": { "code": "...", "message": "...", "details": {} } }
```
