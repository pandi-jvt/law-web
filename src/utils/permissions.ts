import { AccountType, GroupRole, User, UserRole } from 'types';

const normalize = (value?: string | null) => value?.toLowerCase();

export const isIndividualAccount = (user?: User | null) =>
  normalize(user?.account_type ?? user?.accountType) === AccountType.INDIVIDUAL;

export const isGroupAdmin = (user?: User | null) =>
  normalize(user?.account_type ?? user?.accountType) === AccountType.GROUP &&
  normalize(user?.group_role ?? user?.groupRole) === GroupRole.GROUP_ADMIN;

export const isLawyer = (user?: User | null) =>
  normalize(user?.group_role ?? user?.groupRole) === GroupRole.LAWYER ||
  normalize(user?.role) === UserRole.LAWYER;

export const canCreateCase = (user?: User | null) => Boolean(user && (isIndividualAccount(user) || isGroupAdmin(user) || isLawyer(user)));

export const canDeleteCase = (user?: User | null) => Boolean(user && (isIndividualAccount(user) || isGroupAdmin(user) || isLawyer(user)));

export const canManageAssignments = (user?: User | null) => Boolean(user && isGroupAdmin(user));

export const canUploadDocument = (user?: User | null) => {
  const groupRole = normalize(user?.group_role ?? user?.groupRole);
  return Boolean(
    user &&
      (isIndividualAccount(user) ||
        groupRole === GroupRole.GROUP_ADMIN ||
        groupRole === GroupRole.LAWYER ||
        groupRole === GroupRole.JUNIOR)
  );
};
