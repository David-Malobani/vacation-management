import { DataSource } from "typeorm";
import { Role, toUserDto, User, UserDto } from "./user.entity";

export const listUsers = async (dataSource: DataSource, role?: Role): Promise<UserDto[]> => {
	const users = await dataSource.getRepository(User).find({
		where: role ? { role } : {},
		order: { name: "ASC" },
	});
	return users.map(toUserDto);
};

export const findUserById = (dataSource: DataSource, id: number): Promise<User | null> =>
	dataSource.getRepository(User).findOneBy({ id });

/** Includes the password hash, which is excluded from default selects. */
export const findUserByEmailWithPassword = (dataSource: DataSource, email: string): Promise<User | null> =>
	dataSource
		.getRepository(User)
		.createQueryBuilder("user")
		.addSelect("user.password")
		.where("lower(user.email) = lower(:email)", { email })
		.getOne();
