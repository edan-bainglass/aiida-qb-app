type Entity = {
  type: string;
  base: string;
  join_options: string[];
};

const AuthInfoEntity: Entity = {
  type: "authinfo",
  base: "authinfo",
  join_options: ["user", "computer"],
};

const LogEntity: Entity = {
  type: "log",
  base: "log",
  join_options: ["node"],
};

const UserEntity: Entity = {
  type: "user",
  base: "user",
  join_options: ["authinfo", "group", "node", "comment"],
};

const ComputerEntity: Entity = {
  type: "computer",
  base: "computer",
  join_options: ["node"],
};

const NodeEntity: Entity = {
  type: "",
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

const GroupEntity: Entity = {
  type: "group.core",
  base: "group",
  join_options: ["user", "node"],
};

const CommentEntity: Entity = {
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
  group: GroupEntity,
  comment: CommentEntity,
};

export type EntityType = keyof typeof ENTITY_TYPES;
