import { useMutation, useQueryClient } from "@tanstack/react-query";
import { disableUserMutationOptions, enableUserMutationOptions, usersKeys, createUserMutationOptions, updateUserMutationOptions } from "@/lib/users-admin";

export function useCreateUserMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		...createUserMutationOptions(),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: usersKeys.all });
			await queryClient.invalidateQueries({ queryKey: ["audit"] });
		},
	});
}

export function useUpdateUserMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		...updateUserMutationOptions(),
		onSuccess: async (user) => {
			await queryClient.invalidateQueries({ queryKey: usersKeys.all });
			await queryClient.setQueryData(usersKeys.detail(user.id), user);
		},
	});
}

export function useDisableUserMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		...disableUserMutationOptions(),
		onSuccess: async (user) => {
			await queryClient.invalidateQueries({ queryKey: usersKeys.all });
			await queryClient.invalidateQueries({ queryKey: usersKeys.detail(user.id) });
			await queryClient.invalidateQueries({ queryKey: ["audit"] });
		},
	});
}

export function useEnableUserMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		...enableUserMutationOptions(),
		onSuccess: async (user) => {
			await queryClient.invalidateQueries({ queryKey: usersKeys.all });
			await queryClient.invalidateQueries({ queryKey: usersKeys.detail(user.id) });
			await queryClient.invalidateQueries({ queryKey: ["audit"] });
		},
	});
}
