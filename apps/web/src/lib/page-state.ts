import type { OperationError } from "@feedback-360/api-contract";

type FriendlyStateCopy = {
  title: string;
  description: string;
};

const friendlyErrorCopy: Partial<Record<OperationError["code"], FriendlyStateCopy>> = {
  invalid_input: {
    title: "Проверьте ссылку или параметры",
    description:
      "Запрос не удалось обработать. Проверьте введённые значения и попробуйте открыть страницу снова.",
  },
  unauthenticated: {
    title: "Нужно войти в систему",
    description:
      "Сессия не найдена или уже завершилась. Войдите по magic link и повторите действие.",
  },
  forbidden: {
    title: "Эта страница недоступна для вашей роли",
    description:
      "Текущая роль не может открыть этот раздел. Вернитесь назад или переключите активную компанию.",
  },
  not_found: {
    title: "Данные не найдены",
    description: "Похоже, ссылка устарела или нужные данные больше недоступны в активной компании.",
  },
  invalid_transition: {
    title: "Сейчас это действие недоступно",
    description:
      "Состояние анкеты или кампании уже изменилось. Обновите страницу и проверьте актуальный статус.",
  },
  campaign_started_immutable: {
    title: "Кампанию уже нельзя менять",
    description:
      "После запуска кампании состав участников и модель заморожены. Откройте актуальную кампанию или создайте новую версию.",
  },
  campaign_locked: {
    title: "Настройки кампании уже зафиксированы",
    description:
      "После первого сохранения черновика матрица и веса становятся неизменяемыми. Проверьте progress и продолжайте текущую кампанию.",
  },
  campaign_ended_readonly: {
    title: "Кампания завершена",
    description:
      "Анкета переведена в режим только для чтения. Вы можете просмотреть ответы, но не редактировать их.",
  },
  webhook_invalid_signature: {
    title: "Не удалось подтвердить источник запроса",
    description: "Попробуйте повторить действие позже или обратитесь к HR-администратору.",
  },
  webhook_timestamp_invalid: {
    title: "Срок действия запроса истёк",
    description: "Попробуйте повторить действие позже или обратитесь к HR-администратору.",
  },
  ai_job_conflict: {
    title: "AI-обработка уже запущена",
    description:
      "Для этой кампании уже выполняется обработка. Дождитесь завершения текущего job или откройте HR workbench.",
  },
};

export const getFriendlyErrorCopy = (
  error: Pick<OperationError, "code"> | { code: string },
  fallback: FriendlyStateCopy,
): FriendlyStateCopy => {
  if ("code" in error) {
    const copy = friendlyErrorCopy[error.code as OperationError["code"]];
    if (copy) {
      return copy;
    }
  }

  return fallback;
};
