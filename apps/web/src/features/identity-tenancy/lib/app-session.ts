import { cookies } from "next/headers";

export const APP_USER_ID_COOKIE = "go360go_user_id";
export const APP_ACTIVE_COMPANY_COOKIE = "go360go_active_company_id";

export const getAppSession = async (): Promise<{
  userId?: string;
  activeCompanyId?: string;
}> => {
  const cookieStore = await cookies();
  const userId = cookieStore.get(APP_USER_ID_COOKIE)?.value;
  const activeCompanyId = cookieStore.get(APP_ACTIVE_COMPANY_COOKIE)?.value;

  return {
    ...(userId ? { userId } : {}),
    ...(activeCompanyId ? { activeCompanyId } : {}),
  };
};
