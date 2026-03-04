# Results visibility
Status: Draft (2026-03-03)

Зафиксировано:
- Результаты видят HR, руководитель, сотрудник (в своём кабинете).
- Открытые комментарии: сотруднику показываем только агрегат; HR видит оригиналы.
- Оценка руководителя всегда не анонимна (персональная).

MVP правила видимости:
- Employee: агрегаты + AI-processed/summary open text (без raw).
- Manager: агрегаты по команде с учётом anonymity policy; manager group для subject — персонально.
- HR Admin/HR Reader: прогресс + агрегаты + raw open text.

MVP implementation detail (FT-0052):
- `results.getHrView` возвращает `groupVisibility` и per-competency visibility flags.
- Для employee/manager витрин эти flags являются источником truth для скрытия/слияния блоков при малых группах.
