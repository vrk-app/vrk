# Access Matrix

Статус: reference  
Обновлено: 2026-07-05

## Основа доступа

Доступ определяется не одним полем пользователя, а связкой:

1. `Account` - учетная запись человека;
2. `Membership` - участие в конкретной организации;
3. `Scoped grant` - `role_template + scope_type + scope_id`.

## Каталог ролей

| Role template | Пользовательское название | Допустимый scope | Capability catalog |
| --- | --- | --- | --- |
| `organization_admin` | Администратор организации | `organization` | `manage_structure`, `manage_access`, `manage_contracts`, `manage_equipment`, `view_employees`, `manage_employees` |
| `organization_head` | Руководитель организации | `organization` | `view_employees` |
| `division_admin` | Администратор дивизиона | `division` | `manage_structure`, `manage_access`, `manage_contracts`, `manage_equipment`, `view_employees`, `manage_employees` |
| `division_head` | Руководитель дивизиона | `division` | `view_employees` |
| `division_operator` | Сотрудник дивизиона | `division` | Нет capability flags; scoped read-only по рабочим данным. |
| `unit_admin` | Администратор юнита | `unit` | `manage_structure`, `manage_access`, `manage_contracts`, `manage_equipment`, `view_employees`, `manage_employees` |
| `unit_head` | Руководитель юнита | `unit` | `view_employees` |
| `unit_operator` | Сотрудник юнита | `unit` | Нет capability flags; scoped read-only по рабочим данным. |
| `auditor` | Аудитор | `organization`, `division`, `unit` | `view_employees` |

## Матрица доступа customer-contour

| Роль | Scope и видимость workspace | Профиль организации и логотип | Оргструктура | Сотрудники и доступ | Договоры | Оборудование, СИ, эталоны и журналы |
| --- | --- | --- | --- | --- | --- | --- |
| `organization_admin` | Вся организация: дивизионы, прямые юниты и юниты внутри дивизионов. | Управление профилем и логотипом организации. | Создание, редактирование и архивирование дивизионов и юнитов. | Создание/отправка/отзыв invite; просмотр сотрудников; изменение роли/scope; деактивация сотрудников. Нельзя изменить или деактивировать текущий session grant. | Чтение и управление всеми contracts customer-организации; lookup contractors; routing resolve. | Чтение и управление всеми registry records в видимых scope: equipment, measuring instruments, standards; создание journals; архивирование records. |
| `organization_head` | Вся организация. | Только чтение через session/workspace projection. | Только чтение. | Просмотр active employee access rows всей организации. Invite/update/deactivate недоступны. | Чтение contracts всей организации. | Чтение equipment, measuring instruments, standards и journals всей организации. |
| `division_admin` | Один дивизион и его дочерние юниты. | Нет управления профилем организации. | Редактирование/архивирование своего дивизиона; создание/редактирование/архивирование юнитов только внутри своего дивизиона. Новые дивизионы создавать нельзя. | Invite, просмотр, update и deactivate сотрудников только в своем дивизионе и дочерних юнитах. Organization-scope назначить нельзя; self-mutation запрещена. | Чтение и управление contracts, привязанными к своему дивизиону или дочерним юнитам. Organization-level contract создать нельзя. | Чтение и управление equipment/MI в дочерних юнитах; управление standards только на своем division/unit scope; journals доступны для видимых records. |
| `division_head` | Один дивизион и его дочерние юниты. | Только чтение через workspace. | Только чтение. | Просмотр сотрудников своего дивизиона и дочерних юнитов. | Чтение contracts в своем subtree. | Чтение equipment, MI, standards и journals в своем subtree. |
| `division_operator` | Один дивизион и его дочерние юниты. | Только чтение через workspace. | Только чтение. | Нет вкладки сотрудников и нет employee registry доступа. | Чтение contracts в своем subtree. | Чтение equipment, MI, standards и journals в своем subtree. |
| `unit_admin` | Один юнит. | Нет управления профилем организации. | Редактирование/архивирование своего юнита. Создавать новые юниты или дивизионы нельзя. | Invite, просмотр, update и deactivate сотрудников только в своем юните. Broader scope назначить нельзя; self-mutation запрещена. | Чтение и управление только unit-scoped contracts своего юнита. | Чтение и управление equipment/MI своего юнита; управление unit-scoped standards; journals доступны для видимых records. |
| `unit_head` | Один юнит. | Только чтение через workspace. | Только чтение. | Просмотр сотрудников своего юнита. | Чтение contracts своего юнита. | Чтение equipment, MI, standards и journals своего юнита. |
| `unit_operator` | Один юнит. | Только чтение через workspace. | Только чтение. | Нет вкладки сотрудников и нет employee registry доступа. | Чтение contracts своего юнита. | Чтение equipment, MI, standards и journals своего юнита. |
| `auditor` | По назначенному scope: вся организация, один дивизион с дочерними юнитами или один юнит. | Только чтение через workspace. | Только чтение. | Просмотр сотрудников в пределах своего scope. | Чтение contracts в пределах своего scope. | Чтение equipment, MI, standards и journals в пределах своего scope. |
