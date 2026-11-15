CREATE TYPE "public"."categoria_ingrediente" AS ENUM('carnes', 'pescados_mariscos', 'vegetales', 'frutas', 'lacteos', 'granos_harinas', 'condimentos', 'bebidas', 'otros');--> statement-breakpoint
CREATE TYPE "public"."categoria_receta" AS ENUM('plato_principal', 'ensalada', 'pan', 'postre', 'extra', 'hallaca');--> statement-breakpoint
CREATE TYPE "public"."tipo_media" AS ENUM('imagen', 'video_youtube');--> statement-breakpoint
CREATE TYPE "public"."unidad_base" AS ENUM('g', 'ml', 'unidad');--> statement-breakpoint
CREATE TABLE "events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"anio" integer NOT NULL,
	"fecha" date NOT NULL,
	"nombre" text NOT NULL,
	"notas" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingredients" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ingredients_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nombre" text NOT NULL,
	"unidad_base" "unidad_base" NOT NULL,
	"categoria" "categoria_ingrediente" DEFAULT 'otros' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "media_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"url" text NOT NULL,
	"tipo" "tipo_media" DEFAULT 'imagen' NOT NULL,
	"anio" integer NOT NULL,
	"recipe_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_links" (
	"media_id" integer NOT NULL,
	"recipe_event_id" integer NOT NULL,
	CONSTRAINT "media_links_media_id_recipe_event_id_pk" PRIMARY KEY("media_id","recipe_event_id")
);
--> statement-breakpoint
CREATE TABLE "precios_historicos" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "precios_historicos_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"ingredient_id" integer NOT NULL,
	"cantidad_base" numeric(14, 3) NOT NULL,
	"precio_usd" numeric(14, 2),
	"precio_usdt" numeric(14, 2),
	"fecha" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recipe_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"recipe_id" integer NOT NULL,
	"event_id" integer NOT NULL,
	"cantidad" numeric(10, 2) DEFAULT 1 NOT NULL,
	"notas" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_ingredients" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recipe_ingredients_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"recipe_event_id" integer NOT NULL,
	"ingredient_id" integer NOT NULL,
	"cantidad_base" numeric(14, 3) NOT NULL,
	"precio_usd" numeric(14, 2),
	"precio_usdt" numeric(14, 2),
	"fecha_precio" date
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recipes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nombre" text NOT NULL,
	"categoria" "categoria_receta" NOT NULL,
	"descripcion" text,
	"proceso_md" text,
	"video_youtube_url" text,
	"imagen_default_id" integer,
	"es_estandar" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopping_items" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "shopping_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"list_id" integer NOT NULL,
	"ingredient_id" integer NOT NULL,
	"cantidad_base" numeric(14, 3) NOT NULL,
	"comprado" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopping_lists" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "shopping_lists_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"anio" integer NOT NULL,
	"nombre" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_links" ADD CONSTRAINT "media_links_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_links" ADD CONSTRAINT "media_links_recipe_event_id_recipe_events_id_fk" FOREIGN KEY ("recipe_event_id") REFERENCES "public"."recipe_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "precios_historicos" ADD CONSTRAINT "precios_historicos_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_events" ADD CONSTRAINT "recipe_events_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_events" ADD CONSTRAINT "recipe_events_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_event_id_recipe_events_id_fk" FOREIGN KEY ("recipe_event_id") REFERENCES "public"."recipe_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_imagen_default_id_media_id_fk" FOREIGN KEY ("imagen_default_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_items" ADD CONSTRAINT "shopping_items_list_id_shopping_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."shopping_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_items" ADD CONSTRAINT "shopping_items_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "events_anio_nombre" ON "events" USING btree ("anio","nombre");--> statement-breakpoint
CREATE INDEX "events_anio_idx" ON "events" USING btree ("anio");--> statement-breakpoint
CREATE UNIQUE INDEX "ingredients_nombre_lower" ON "ingredients" USING btree (lower("nombre"));--> statement-breakpoint
CREATE INDEX "media_recipe_idx" ON "media" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "media_anio_idx" ON "media" USING btree ("anio");--> statement-breakpoint
CREATE INDEX "ph_ingredient_fecha_idx" ON "precios_historicos" USING btree ("ingredient_id","fecha");--> statement-breakpoint
CREATE UNIQUE INDEX "ph_dedupe" ON "precios_historicos" USING btree ("ingredient_id","fecha","cantidad_base",coalesce("precio_usd", -1),coalesce("precio_usdt", -1));--> statement-breakpoint
CREATE UNIQUE INDEX "recipe_events_unique" ON "recipe_events" USING btree ("recipe_id","event_id");--> statement-breakpoint
CREATE INDEX "ri_recipe_event_idx" ON "recipe_ingredients" USING btree ("recipe_event_id");--> statement-breakpoint
CREATE INDEX "ri_ingredient_idx" ON "recipe_ingredients" USING btree ("ingredient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recipes_nombre_lower" ON "recipes" USING btree (lower("nombre"));