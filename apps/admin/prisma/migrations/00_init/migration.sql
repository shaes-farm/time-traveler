-- CreateTable
CREATE TABLE "categories" (
    "id" BIGSERIAL NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "title" VARCHAR(2000) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_categories" (
    "historical_event_id" BIGINT NOT NULL,
    "category_id" BIGINT NOT NULL,

    CONSTRAINT "event_categories_pkey" PRIMARY KEY ("historical_event_id","category_id")
);

-- CreateTable
CREATE TABLE "event_media" (
    "historical_event_id" BIGINT NOT NULL,
    "media_id" BIGINT NOT NULL,

    CONSTRAINT "event_media_pkey" PRIMARY KEY ("historical_event_id","media_id")
);

-- CreateTable
CREATE TABLE "historical_events" (
    "id" BIGSERIAL NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "title" VARCHAR(2000) NOT NULL,
    "summary" TEXT,
    "detail" TEXT,
    "location" VARCHAR(2000),
    "importance" INTEGER NOT NULL,
    "begin_date" VARCHAR(1000) NOT NULL,
    "end_date" VARCHAR(1000) NOT NULL,
    "timeline_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historical_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" BIGSERIAL NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "alternativetext" TEXT,
    "caption" TEXT,
    "url" VARCHAR(2000),
    "width" INTEGER,
    "height" INTEGER,
    "formats" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "period_timelines" (
    "period_id" BIGINT NOT NULL,
    "timeline_id" BIGINT NOT NULL,

    CONSTRAINT "period_timelines_pkey" PRIMARY KEY ("period_id","timeline_id")
);

-- CreateTable
CREATE TABLE "periods" (
    "id" BIGSERIAL NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "title" VARCHAR(2000) NOT NULL,
    "summary" TEXT,
    "begin_date" VARCHAR(1000) NOT NULL,
    "end_date" VARCHAR(1000) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_events" (
    "timeline_id" BIGINT NOT NULL,
    "historical_event_id" BIGINT NOT NULL,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("timeline_id","historical_event_id")
);

-- CreateTable
CREATE TABLE "timelines" (
    "id" BIGSERIAL NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "title" VARCHAR(2000) NOT NULL,
    "summary" TEXT,
    "scale" VARCHAR(2000),
    "begin_date" VARCHAR(1000) NOT NULL,
    "end_date" VARCHAR(1000) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timelines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_idx" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "historical_events_slug_idx" ON "historical_events"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "media_slug_idx" ON "media"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "periods_slug_idx" ON "periods"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "timelines_slug_idx" ON "timelines"("slug");

-- AddForeignKey
ALTER TABLE "event_categories" ADD CONSTRAINT "event_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "event_categories" ADD CONSTRAINT "event_categories_historical_event_id_fkey" FOREIGN KEY ("historical_event_id") REFERENCES "historical_events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "event_media" ADD CONSTRAINT "event_media_historical_event_id_fkey" FOREIGN KEY ("historical_event_id") REFERENCES "historical_events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "event_media" ADD CONSTRAINT "event_media_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "historical_events" ADD CONSTRAINT "historical_events_timeline_id_fkey" FOREIGN KEY ("timeline_id") REFERENCES "timelines"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "period_timelines" ADD CONSTRAINT "period_timelines_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "period_timelines" ADD CONSTRAINT "period_timelines_timeline_id_fkey" FOREIGN KEY ("timeline_id") REFERENCES "timelines"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_historical_event_id_fkey" FOREIGN KEY ("historical_event_id") REFERENCES "historical_events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_timeline_id_fkey" FOREIGN KEY ("timeline_id") REFERENCES "timelines"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

