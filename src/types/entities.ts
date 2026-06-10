type Entity = {
  type: string;
  base: string;
  join_options: string[];
};

export const AuthInfoEntity: Entity = {
  type: "authinfo",
  base: "authinfo",
  join_options: ["user", "computer"],
};

export const LogEntity: Entity = {
  type: "log",
  base: "log",
  join_options: ["node"],
};

export const UserEntity: Entity = {
  type: "user",
  base: "user",
  join_options: ["authinfo", "group", "node", "comment"],
};

export const ComputerEntity: Entity = {
  type: "computer",
  base: "computer",
  join_options: ["node"],
};

export const NodeEntity: Entity = {
  type: "node",
  base: "node",
  join_options: [
    "user",
    "computer",
    "group",
    "comment",
    "log",
    "incoming",
    "outgoing",
    "descendents",
    "ancestors",
  ],
};

export const GroupEntity: Entity = {
  type: "group.core",
  base: "group",
  join_options: ["user", "node"],
};

export const CommentEntity: Entity = {
  type: "comment",
  base: "comment",
  join_options: ["user", "node"],
};

export const ENTITY_TYPES: Record<string, Entity> = {
  authinfo: AuthInfoEntity,
  log: LogEntity,
  user: UserEntity,
  computer: ComputerEntity,
  node: NodeEntity,
  "group.core": GroupEntity,
  comment: CommentEntity,
};

export type EntityType = keyof typeof ENTITY_TYPES;
