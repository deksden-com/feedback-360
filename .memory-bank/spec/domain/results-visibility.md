# Results visibility
Status: Draft (2026-03-03)

Зафиксировано:
- Результаты видят HR, руководитель, сотрудник (в своём кабинете).
- Открытые комментарии: сотруднику показываем только агрегат; HR видит оригиналы.
- Оценка руководителя всегда не анонимна (персональная).

MVP правила видимости:
- Employee: агрегаты + AI-processed/summary open text (без raw).
- Manager: агрегаты по команде с учётом anonymity policy; manager group для subject — персонально.
- HR Admin: прогресс + агрегаты + raw/processed/summary open text.
- HR Reader: прогресс + агрегаты + processed/summary open text (без raw).

MVP implementation detail (FT-0052):
- `results.getHrView` возвращает `groupVisibility` и per-competency visibility flags.
- Для employee/manager витрин эти flags являются источником truth для скрытия/слияния блоков при малых группах.

Production readiness update (FT-0101):
- `results.getHrView` остаётся общей HR operation для `hr_admin` и `hr_reader`, но payload зависит от роли.
- `hr_admin` получает raw text для operational расследований и HR moderation.
- `hr_reader` получает ту же HR витрину без `rawText`, чтобы read-only HR доступ не раскрывал оригинальную формулировку авторов.
