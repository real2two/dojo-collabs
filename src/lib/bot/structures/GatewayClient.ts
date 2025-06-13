import type { DiscordenoShard, GatewayIntents } from "@discordeno/bot";
import {
	type GatewayManager,
	ShardSocketCloseCodes,
	createGatewayManager,
} from "@discordeno/gateway";
import { type RestManager, createRestManager } from "@discordeno/rest";
import type { ListenerEventData } from "../utils/events";

// This is based on @discordeno/bot but I created a minimal version of it

export class GatewayClient {
	token: string;
	gateway: GatewayManager;
	rest: RestManager;
	events: {
		[E in keyof ListenerEventData]?: (
			data: ListenerEventData[E],
			shard: DiscordenoShard,
			// biome-ignore lint/suspicious/noExplicitAny: Allow any return type
		) => any;
	};

	constructor({
		token,
		intents,
		events,
	}: {
		token: string;
		intents: GatewayIntents;
		events: GatewayClient["events"];
	}) {
		this.token = token;
		this.rest = createRestManager({ token: this.token });
		this.gateway = createGatewayManager({
			token: this.token,
			intents,
			preferSnakeCase: true,
			events: {},
		});
		this.events = events;
	}

	async start() {
		this.gateway.connection = await this.rest.getSessionInfo();

		this.gateway.url = this.gateway.connection.url;
		this.gateway.totalShards = this.gateway.connection.shards;
		this.gateway.lastShardId = this.gateway.connection.shards - 1;

		this.gateway.resharding.getSessionInfo = () => this.rest.getGatewayBot();

		this.gateway.events.message = async (shard, data) => {
			if (!data.t) return;

			try {
				// @ts-ignore Run the function and send over the data
				this.events[data.t]?.(data.d, shard);
			} catch (err) {
				console.error(err);
			}
		};

		await this.gateway.spawnShards();
	}
	shutdown() {
		return this.gateway.shutdown(
			ShardSocketCloseCodes.Shutdown,
			"Shutdown requested",
		);
	}
}
