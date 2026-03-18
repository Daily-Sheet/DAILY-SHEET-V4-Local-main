--
-- PostgreSQL database dump
--

\restrict jTvC9f4ZFlLmBp9psglOa3otgBvXrob4BZ78h61NhyBezcYhHYQ6dgQZNiy9KAR

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: activity_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activity_log (id, actor_id, actor_name, type, action, title, message, event_name, created_at, workspace_id, details) FROM stdin;
1	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	deleted	Show	Removed "Show" from Camp Okizu	Camp Okizu	2026-02-26 14:57:07.020844	1	\N
2	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Load in	Added "Load in" to Camp Okizu	Camp Okizu	2026-02-26 14:58:30.555343	1	\N
3	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	updated	Load in	Updated "Load in" in Camp Okizu	Camp Okizu	2026-02-26 14:58:48.424898	1	\N
4	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	deleted	Load in	Removed "Load in" from Camp Okizu	Camp Okizu	2026-02-26 14:58:58.938933	1	\N
5	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	assignment_change	created	Show Assignment	Assigned crew member to "Camp Okizu"	Camp Okizu	2026-02-28 19:04:41.592987	1	[{"field":"Crew Member","value":"crew member"},{"field":"Show","value":"Camp Okizu"}]
6	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	updated	Load In	Updated "Load In" in Camp Okizu	Camp Okizu	2026-02-28 20:06:06.093486	1	[{"field":"End Time","from":"","to":"1:00 AM"}]
7	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	updated	Load In	Updated "Load In" in Camp Okizu	Camp Okizu	2026-02-28 20:06:45.440853	1	\N
8	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Show	Added "Show" to Stage 1	Stage 1	2026-03-01 16:04:24.534135	1	[{"field":"Category","value":"Show"},{"field":"Start Time","value":"4:04 PM"},{"field":"End Time","value":"5:04 PM"},{"field":"Date","value":"2026-03-01"}]
9	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	updated	Lunch	Updated "Lunch" in Camp Okizu	Camp Okizu	2026-03-01 16:21:06.61401	1	[{"field":"End Time","from":"","to":"9:00 PM"}]
10	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	assignment_change	created	Show Assignment	Assigned crew member to "Stage 1"	Stage 1	2026-03-01 16:42:54.269673	1	[{"field":"Crew Member","value":"crew member"},{"field":"Show","value":"Stage 1"}]
11	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	assignment_change	created	Show Assignment	Assigned crew member to "Stage 1"	Stage 1	2026-03-01 16:43:03.262337	1	[{"field":"Crew Member","value":"crew member"},{"field":"Show","value":"Stage 1"}]
12	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	assignment_change	created	Show Assignment	Assigned crew member to "Stage 1"	Stage 1	2026-03-01 16:43:05.756247	1	[{"field":"Crew Member","value":"crew member"},{"field":"Show","value":"Stage 1"}]
13	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	assignment_change	created	Show Assignment	Assigned crew member to "Stage 1"	Stage 1	2026-03-01 16:43:09.421337	1	[{"field":"Crew Member","value":"crew member"},{"field":"Show","value":"Stage 1"}]
14	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	assignment_change	created	Show Assignment	Assigned crew member to "Stage 1"	Stage 1	2026-03-01 16:45:54.491069	1	[{"field":"Crew Member","value":"crew member"},{"field":"Show","value":"Stage 1"}]
15	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	assignment_change	created	Show Assignment	Assigned crew member to "Stage 1"	Stage 1	2026-03-01 16:46:02.909306	1	[{"field":"Crew Member","value":"crew member"},{"field":"Show","value":"Stage 1"}]
16	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	assignment_change	created	Show Assignment	Assigned crew member to "Stage 1"	Stage 1	2026-03-01 16:47:24.070262	1	[{"field":"Crew Member","value":"crew member"},{"field":"Show","value":"Stage 1"}]
17	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	assignment_change	created	Show Assignment	Assigned crew member to "Stage 1"	Stage 1	2026-03-01 16:47:27.959573	1	[{"field":"Crew Member","value":"crew member"},{"field":"Show","value":"Stage 1"}]
18	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	assignment_change	created	Show Assignment	Assigned crew member to "Stage 1"	Stage 1	2026-03-01 16:47:29.241882	1	[{"field":"Crew Member","value":"crew member"},{"field":"Show","value":"Stage 1"}]
19	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	assignment_change	created	Show Assignment	Assigned crew member to "Stage 1"	Stage 1	2026-03-01 16:48:31.69149	1	[{"field":"Crew Member","value":"crew member"},{"field":"Show","value":"Stage 1"}]
20	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	assignment_change	created	Show Assignment	Assigned crew member to "Stage 1"	Stage 1	2026-03-01 16:48:39.63287	1	[{"field":"Crew Member","value":"crew member"},{"field":"Show","value":"Stage 1"}]
21	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	assignment_change	created	Show Assignment	Assigned crew member to "Stage 1"	Stage 1	2026-03-01 16:48:49.540512	1	[{"field":"Crew Member","value":"crew member"},{"field":"Show","value":"Stage 1"}]
22	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	assignment_change	created	Show Assignment	Assigned crew member to "Stage 1"	Stage 1	2026-03-01 17:01:10.261504	1	[{"field":"Crew Member","value":"crew member"},{"field":"Show","value":"Stage 1"}]
23	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Site Open / Load In	Added "Site Open / Load In" to Stage 1	Stage 1	2026-03-01 17:07:27.354927	1	[{"field":"Title","value":"Site Open / Load In"},{"field":"Category","value":"Load In"},{"field":"Start Time","value":"2:00 PM"},{"field":"End Time","value":"4:00 PM"},{"field":"Date","value":"2026-03-01"}]
24	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Sound Checks - All Stages	Added "Sound Checks - All Stages" to Stage 1	Stage 1	2026-03-01 17:07:27.672507	1	[{"field":"Title","value":"Sound Checks - All Stages"},{"field":"Category","value":"Sound Check"},{"field":"Start Time","value":"4:00 PM"},{"field":"End Time","value":"7:00 PM"},{"field":"Date","value":"2026-03-01"}]
25	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Crew Lunch	Added "Crew Lunch" to Stage 1	Stage 1	2026-03-01 17:07:28.019966	1	[{"field":"Title","value":"Crew Lunch"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"7:00 PM"},{"field":"End Time","value":"8:00 PM"},{"field":"Date","value":"2026-03-01"}]
26	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Gates Open	Added "Gates Open" to Stage 1	Stage 1	2026-03-01 17:07:28.443535	1	[{"field":"Title","value":"Gates Open"},{"field":"Category","value":"Doors Open"},{"field":"Start Time","value":"8:00 PM"},{"field":"End Time","value":"8:30 PM"},{"field":"Date","value":"2026-03-01"}]
27	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Main Stage - Act 1	Added "Main Stage - Act 1" to Stage 1	Stage 1	2026-03-01 17:07:28.872561	1	[{"field":"Title","value":"Main Stage - Act 1"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"9:00 PM"},{"field":"End Time","value":"10:00 PM"},{"field":"Date","value":"2026-03-01"}]
28	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Main Stage - Act 2	Added "Main Stage - Act 2" to Stage 1	Stage 1	2026-03-01 17:07:29.307655	1	[{"field":"Title","value":"Main Stage - Act 2"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"11:00 PM"},{"field":"End Time","value":"12:30 AM"},{"field":"Date","value":"2026-03-01"}]
30	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Headliner	Added "Headliner" to Stage 1	Stage 1	2026-03-01 17:07:30.009299	1	[{"field":"Title","value":"Headliner"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"4:00 AM"},{"field":"End Time","value":"6:00 AM"},{"field":"Date","value":"2026-03-01"}]
29	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Crew Dinner	Added "Crew Dinner" to Stage 1	Stage 1	2026-03-01 17:07:29.741585	1	[{"field":"Title","value":"Crew Dinner"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"1:00 AM"},{"field":"End Time","value":"2:00 AM"},{"field":"Date","value":"2026-03-01"}]
31	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Load In	Added "Load In" to Stage 1	Stage 1	2026-03-01 17:07:46.650362	1	[{"field":"Title","value":"Load In"},{"field":"Category","value":"Load In"},{"field":"Start Time","value":"4:00 PM"},{"field":"End Time","value":"6:00 PM"},{"field":"Date","value":"2026-03-02"}]
32	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Stage Setup	Added "Stage Setup" to Stage 1	Stage 1	2026-03-01 17:07:46.927946	1	[{"field":"Title","value":"Stage Setup"},{"field":"Category","value":"Load In"},{"field":"Start Time","value":"6:00 PM"},{"field":"End Time","value":"8:00 PM"},{"field":"Date","value":"2026-03-02"}]
33	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Lunch	Added "Lunch" to Stage 1	Stage 1	2026-03-01 17:07:47.120718	1	[{"field":"Title","value":"Lunch"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"8:00 PM"},{"field":"End Time","value":"9:00 PM"},{"field":"Date","value":"2026-03-02"}]
34	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Sound Check	Added "Sound Check" to Stage 1	Stage 1	2026-03-01 17:07:47.315724	1	[{"field":"Title","value":"Sound Check"},{"field":"Category","value":"Sound Check"},{"field":"Start Time","value":"10:00 PM"},{"field":"End Time","value":"12:00 AM"},{"field":"Date","value":"2026-03-02"}]
35	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Dinner	Added "Dinner" to Stage 1	Stage 1	2026-03-01 17:07:47.527956	1	[{"field":"Title","value":"Dinner"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"1:00 AM"},{"field":"End Time","value":"2:00 AM"},{"field":"Date","value":"2026-03-02"}]
36	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Doors Open	Added "Doors Open" to Stage 1	Stage 1	2026-03-01 17:07:47.780252	1	[{"field":"Title","value":"Doors Open"},{"field":"Category","value":"Doors Open"},{"field":"Start Time","value":"3:00 AM"},{"field":"End Time","value":"3:30 AM"},{"field":"Date","value":"2026-03-02"}]
37	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Show	Added "Show" to Stage 1	Stage 1	2026-03-01 17:07:48.000054	1	[{"field":"Title","value":"Show"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"4:00 AM"},{"field":"End Time","value":"6:00 AM"},{"field":"Date","value":"2026-03-02"}]
38	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	deleted	Show	Removed "Show" from Stage 1	Stage 1	2026-03-01 17:07:53.742699	1	[{"field":"Title","value":"Show"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"4:00 AM"},{"field":"End Time","value":"6:00 AM"},{"field":"Date","value":"2026-03-02"}]
39	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	deleted	Doors Open	Removed "Doors Open" from Stage 1	Stage 1	2026-03-01 17:07:56.057074	1	[{"field":"Title","value":"Doors Open"},{"field":"Category","value":"Doors Open"},{"field":"Start Time","value":"3:00 AM"},{"field":"End Time","value":"3:30 AM"},{"field":"Date","value":"2026-03-02"}]
40	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Dinner	Added "Dinner" to Stage 1	Stage 1	2026-03-01 17:08:10.062109	1	[{"field":"Title","value":"Dinner"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"1:00 AM"},{"field":"End Time","value":"2:00 AM"},{"field":"Date","value":"2026-03-03"}]
41	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Load In	Added "Load In" to Stage 1	Stage 1	2026-03-01 17:08:10.316144	1	[{"field":"Title","value":"Load In"},{"field":"Category","value":"Load In"},{"field":"Start Time","value":"4:00 PM"},{"field":"End Time","value":"6:00 PM"},{"field":"Date","value":"2026-03-03"}]
42	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Stage Setup	Added "Stage Setup" to Stage 1	Stage 1	2026-03-01 17:08:10.54716	1	[{"field":"Title","value":"Stage Setup"},{"field":"Category","value":"Load In"},{"field":"Start Time","value":"6:00 PM"},{"field":"End Time","value":"8:00 PM"},{"field":"Date","value":"2026-03-03"}]
43	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Lunch	Added "Lunch" to Stage 1	Stage 1	2026-03-01 17:08:10.764902	1	[{"field":"Title","value":"Lunch"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"8:00 PM"},{"field":"End Time","value":"9:00 PM"},{"field":"Date","value":"2026-03-03"}]
44	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Sound Check	Added "Sound Check" to Stage 1	Stage 1	2026-03-01 17:08:10.988074	1	[{"field":"Title","value":"Sound Check"},{"field":"Category","value":"Sound Check"},{"field":"Start Time","value":"10:00 PM"},{"field":"End Time","value":"12:00 AM"},{"field":"Date","value":"2026-03-03"}]
45	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Dinner	Added "Dinner" to Stage 1	Stage 1	2026-03-01 17:08:24.475526	1	[{"field":"Title","value":"Dinner"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"1:00 AM"},{"field":"End Time","value":"2:00 AM"},{"field":"Date","value":"2026-03-04"}]
46	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Load In	Added "Load In" to Stage 1	Stage 1	2026-03-01 17:08:24.738172	1	[{"field":"Title","value":"Load In"},{"field":"Category","value":"Load In"},{"field":"Start Time","value":"4:00 PM"},{"field":"End Time","value":"6:00 PM"},{"field":"Date","value":"2026-03-04"}]
47	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Stage Setup	Added "Stage Setup" to Stage 1	Stage 1	2026-03-01 17:08:24.962017	1	[{"field":"Title","value":"Stage Setup"},{"field":"Category","value":"Load In"},{"field":"Start Time","value":"6:00 PM"},{"field":"End Time","value":"8:00 PM"},{"field":"Date","value":"2026-03-04"}]
48	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Lunch	Added "Lunch" to Stage 1	Stage 1	2026-03-01 17:08:25.186543	1	[{"field":"Title","value":"Lunch"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"8:00 PM"},{"field":"End Time","value":"9:00 PM"},{"field":"Date","value":"2026-03-04"}]
49	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Sound Check	Added "Sound Check" to Stage 1	Stage 1	2026-03-01 17:08:25.479406	1	[{"field":"Title","value":"Sound Check"},{"field":"Category","value":"Sound Check"},{"field":"Start Time","value":"10:00 PM"},{"field":"End Time","value":"12:00 AM"},{"field":"Date","value":"2026-03-04"}]
50	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Site Open / Load In	Added "Site Open / Load In" to Stage 1	Stage 1	2026-03-01 17:08:44.237115	1	[{"field":"Title","value":"Site Open / Load In"},{"field":"Category","value":"Load In"},{"field":"Start Time","value":"2:00 PM"},{"field":"End Time","value":"4:00 PM"},{"field":"Date","value":"2026-03-05"}]
51	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Sound Checks - All Stages	Added "Sound Checks - All Stages" to Stage 1	Stage 1	2026-03-01 17:08:44.583671	1	[{"field":"Title","value":"Sound Checks - All Stages"},{"field":"Category","value":"Sound Check"},{"field":"Start Time","value":"4:00 PM"},{"field":"End Time","value":"7:00 PM"},{"field":"Date","value":"2026-03-05"}]
52	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Crew Lunch	Added "Crew Lunch" to Stage 1	Stage 1	2026-03-01 17:08:44.76954	1	[{"field":"Title","value":"Crew Lunch"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"7:00 PM"},{"field":"End Time","value":"8:00 PM"},{"field":"Date","value":"2026-03-05"}]
53	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Gates Open	Added "Gates Open" to Stage 1	Stage 1	2026-03-01 17:08:44.956218	1	[{"field":"Title","value":"Gates Open"},{"field":"Category","value":"Doors Open"},{"field":"Start Time","value":"8:00 PM"},{"field":"End Time","value":"8:30 PM"},{"field":"Date","value":"2026-03-05"}]
54	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Main Stage - Act 1	Added "Main Stage - Act 1" to Stage 1	Stage 1	2026-03-01 17:08:45.177034	1	[{"field":"Title","value":"Main Stage - Act 1"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"9:00 PM"},{"field":"End Time","value":"10:00 PM"},{"field":"Date","value":"2026-03-05"}]
55	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Main Stage - Act 2	Added "Main Stage - Act 2" to Stage 1	Stage 1	2026-03-01 17:08:45.489849	1	[{"field":"Title","value":"Main Stage - Act 2"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"11:00 PM"},{"field":"End Time","value":"12:30 AM"},{"field":"Date","value":"2026-03-05"}]
56	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Crew Dinner	Added "Crew Dinner" to Stage 1	Stage 1	2026-03-01 17:08:45.758285	1	[{"field":"Title","value":"Crew Dinner"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"1:00 AM"},{"field":"End Time","value":"2:00 AM"},{"field":"Date","value":"2026-03-05"}]
57	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Headliner	Added "Headliner" to Stage 1	Stage 1	2026-03-01 17:08:45.987272	1	[{"field":"Title","value":"Headliner"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"4:00 AM"},{"field":"End Time","value":"6:00 AM"},{"field":"Date","value":"2026-03-05"}]
58	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Site Open / Load In	Added "Site Open / Load In" to Stage 1	Stage 1	2026-03-01 17:08:50.80553	1	[{"field":"Title","value":"Site Open / Load In"},{"field":"Category","value":"Load In"},{"field":"Start Time","value":"2:00 PM"},{"field":"End Time","value":"4:00 PM"},{"field":"Date","value":"2026-03-06"}]
59	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Sound Checks - All Stages	Added "Sound Checks - All Stages" to Stage 1	Stage 1	2026-03-01 17:08:51.066239	1	[{"field":"Title","value":"Sound Checks - All Stages"},{"field":"Category","value":"Sound Check"},{"field":"Start Time","value":"4:00 PM"},{"field":"End Time","value":"7:00 PM"},{"field":"Date","value":"2026-03-06"}]
60	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Crew Lunch	Added "Crew Lunch" to Stage 1	Stage 1	2026-03-01 17:08:51.250109	1	[{"field":"Title","value":"Crew Lunch"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"7:00 PM"},{"field":"End Time","value":"8:00 PM"},{"field":"Date","value":"2026-03-06"}]
61	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Gates Open	Added "Gates Open" to Stage 1	Stage 1	2026-03-01 17:08:51.455024	1	[{"field":"Title","value":"Gates Open"},{"field":"Category","value":"Doors Open"},{"field":"Start Time","value":"8:00 PM"},{"field":"End Time","value":"8:30 PM"},{"field":"Date","value":"2026-03-06"}]
62	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Main Stage - Act 1	Added "Main Stage - Act 1" to Stage 1	Stage 1	2026-03-01 17:08:51.669448	1	[{"field":"Title","value":"Main Stage - Act 1"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"9:00 PM"},{"field":"End Time","value":"10:00 PM"},{"field":"Date","value":"2026-03-06"}]
63	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Main Stage - Act 2	Added "Main Stage - Act 2" to Stage 1	Stage 1	2026-03-01 17:08:51.9264	1	[{"field":"Title","value":"Main Stage - Act 2"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"11:00 PM"},{"field":"End Time","value":"12:30 AM"},{"field":"Date","value":"2026-03-06"}]
64	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Crew Dinner	Added "Crew Dinner" to Stage 1	Stage 1	2026-03-01 17:08:52.158458	1	[{"field":"Title","value":"Crew Dinner"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"1:00 AM"},{"field":"End Time","value":"2:00 AM"},{"field":"Date","value":"2026-03-06"}]
65	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Headliner	Added "Headliner" to Stage 1	Stage 1	2026-03-01 17:08:52.431616	1	[{"field":"Title","value":"Headliner"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"4:00 AM"},{"field":"End Time","value":"6:00 AM"},{"field":"Date","value":"2026-03-06"}]
66	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Site Open / Load In	Added "Site Open / Load In" to Stage 1	Stage 1	2026-03-01 17:08:56.490486	1	[{"field":"Title","value":"Site Open / Load In"},{"field":"Category","value":"Load In"},{"field":"Start Time","value":"2:00 PM"},{"field":"End Time","value":"4:00 PM"},{"field":"Date","value":"2026-03-07"}]
67	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Sound Checks - All Stages	Added "Sound Checks - All Stages" to Stage 1	Stage 1	2026-03-01 17:08:56.748364	1	[{"field":"Title","value":"Sound Checks - All Stages"},{"field":"Category","value":"Sound Check"},{"field":"Start Time","value":"4:00 PM"},{"field":"End Time","value":"7:00 PM"},{"field":"Date","value":"2026-03-07"}]
68	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Crew Lunch	Added "Crew Lunch" to Stage 1	Stage 1	2026-03-01 17:08:56.934853	1	[{"field":"Title","value":"Crew Lunch"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"7:00 PM"},{"field":"End Time","value":"8:00 PM"},{"field":"Date","value":"2026-03-07"}]
69	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Gates Open	Added "Gates Open" to Stage 1	Stage 1	2026-03-01 17:08:57.117018	1	[{"field":"Title","value":"Gates Open"},{"field":"Category","value":"Doors Open"},{"field":"Start Time","value":"8:00 PM"},{"field":"End Time","value":"8:30 PM"},{"field":"Date","value":"2026-03-07"}]
70	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Main Stage - Act 1	Added "Main Stage - Act 1" to Stage 1	Stage 1	2026-03-01 17:08:57.332186	1	[{"field":"Title","value":"Main Stage - Act 1"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"9:00 PM"},{"field":"End Time","value":"10:00 PM"},{"field":"Date","value":"2026-03-07"}]
71	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Main Stage - Act 2	Added "Main Stage - Act 2" to Stage 1	Stage 1	2026-03-01 17:08:57.549868	1	[{"field":"Title","value":"Main Stage - Act 2"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"11:00 PM"},{"field":"End Time","value":"12:30 AM"},{"field":"Date","value":"2026-03-07"}]
72	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Crew Dinner	Added "Crew Dinner" to Stage 1	Stage 1	2026-03-01 17:08:57.887621	1	[{"field":"Title","value":"Crew Dinner"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"1:00 AM"},{"field":"End Time","value":"2:00 AM"},{"field":"Date","value":"2026-03-07"}]
73	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Headliner	Added "Headliner" to Stage 1	Stage 1	2026-03-01 17:08:58.120902	1	[{"field":"Title","value":"Headliner"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"4:00 AM"},{"field":"End Time","value":"6:00 AM"},{"field":"Date","value":"2026-03-07"}]
74	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Site Open / Load In	Added "Site Open / Load In" to Stage 1	Stage 1	2026-03-01 17:09:02.92368	1	[{"field":"Title","value":"Site Open / Load In"},{"field":"Category","value":"Load In"},{"field":"Start Time","value":"1:00 PM"},{"field":"End Time","value":"3:00 PM"},{"field":"Date","value":"2026-03-08"}]
75	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Sound Checks - All Stages	Added "Sound Checks - All Stages" to Stage 1	Stage 1	2026-03-01 17:09:03.439802	1	[{"field":"Title","value":"Sound Checks - All Stages"},{"field":"Category","value":"Sound Check"},{"field":"Start Time","value":"3:00 PM"},{"field":"End Time","value":"6:00 PM"},{"field":"Date","value":"2026-03-08"}]
76	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Crew Lunch	Added "Crew Lunch" to Stage 1	Stage 1	2026-03-01 17:09:03.630271	1	[{"field":"Title","value":"Crew Lunch"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"6:00 PM"},{"field":"End Time","value":"7:00 PM"},{"field":"Date","value":"2026-03-08"}]
78	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Main Stage - Act 1	Added "Main Stage - Act 1" to Stage 1	Stage 1	2026-03-01 17:09:04.019939	1	[{"field":"Title","value":"Main Stage - Act 1"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"8:00 PM"},{"field":"End Time","value":"9:00 PM"},{"field":"Date","value":"2026-03-08"}]
80	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Crew Dinner	Added "Crew Dinner" to Stage 1	Stage 1	2026-03-01 17:09:04.438947	1	[{"field":"Title","value":"Crew Dinner"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"12:00 AM"},{"field":"End Time","value":"1:00 AM"},{"field":"Date","value":"2026-03-08"}]
77	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Gates Open	Added "Gates Open" to Stage 1	Stage 1	2026-03-01 17:09:03.815617	1	[{"field":"Title","value":"Gates Open"},{"field":"Category","value":"Doors Open"},{"field":"Start Time","value":"7:00 PM"},{"field":"End Time","value":"7:30 PM"},{"field":"Date","value":"2026-03-08"}]
79	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Main Stage - Act 2	Added "Main Stage - Act 2" to Stage 1	Stage 1	2026-03-01 17:09:04.220479	1	[{"field":"Title","value":"Main Stage - Act 2"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"10:00 PM"},{"field":"End Time","value":"11:30 PM"},{"field":"Date","value":"2026-03-08"}]
81	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Headliner	Added "Headliner" to Stage 1	Stage 1	2026-03-01 17:09:04.709632	1	[{"field":"Title","value":"Headliner"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"3:00 AM"},{"field":"End Time","value":"5:00 AM"},{"field":"Date","value":"2026-03-08"}]
82	cbd4054a-735a-42a0-8507-d395e85b412f	Test Manager	assignment_change	created	Show Assignment	Assigned crew member to "Auto Test Show"	Auto Test Show	2026-03-01 18:01:27.746185	13	[{"field":"Crew Member","value":"crew member"},{"field":"Show","value":"Auto Test Show"}]
83	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Show	Added "Show" to Camp Okizu	Camp Okizu	2026-03-01 21:14:58.552893	1	[{"field":"Category","value":"Show"},{"field":"Start Time","value":"7:00 AM"},{"field":"End Time","value":"6:55 AM"},{"field":"Date","value":"2026-03-13"}]
84	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	updated	DAY 1	Updated "DAY 1" in Camp Okizu	Camp Okizu	2026-03-01 21:15:34.7756	1	[{"field":"Title","from":"","to":"DAY 1"},{"field":"End Time","from":"6:55 AM","to":"7:00 AM"}]
85	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	updated	DAY 1	Updated "DAY 1" in Camp Okizu	Camp Okizu	2026-03-01 21:16:01.40189	1	[{"field":"End Time","from":"7:00 AM","to":"6:55 AM"}]
86	8e2a0d5c-8781-4efd-9713-8aeb6ef1e00f	Gantt Tester	schedule_change	created	Sound Check	Added "Sound Check" to Test Show	Test Show	2026-03-01 22:05:02.347156	17	[{"field":"Title","value":"Sound Check"},{"field":"Category","value":"Sound Check"},{"field":"Start Time","value":"2:00 PM"},{"field":"End Time","value":"3:00 PM"},{"field":"Date","value":"2026-03-01"}]
87	8e2a0d5c-8781-4efd-9713-8aeb6ef1e00f	Gantt Tester	schedule_change	created	Doors Open	Added "Doors Open" to Test Show	Test Show	2026-03-01 22:05:41.011032	17	[{"field":"Title","value":"Doors Open"},{"field":"Category","value":"Doors Open"},{"field":"Start Time","value":"10:05 PM"},{"field":"End Time","value":"11:05 PM"},{"field":"Date","value":"2026-03-01"}]
88	dad5d4d8-5808-4dbe-b304-af6e142895fb	Gantt Tester2	schedule_change	created	Sound Check	Added "Sound Check" to Gantt Show	Gantt Show	2026-03-01 22:08:57.952879	18	[{"field":"Title","value":"Sound Check"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"10:08 PM"},{"field":"End Time","value":"11:08 PM"},{"field":"Date","value":"2026-03-01"}]
89	dad5d4d8-5808-4dbe-b304-af6e142895fb	Gantt Tester2	schedule_change	created	Doors Open	Added "Doors Open" to Gantt Show	Gantt Show	2026-03-01 22:09:19.793972	18	[{"field":"Title","value":"Doors Open"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"10:09 PM"},{"field":"End Time","value":"11:09 PM"},{"field":"Date","value":"2026-03-01"}]
90	66bc3b91-84a7-4e45-a7dd-75443c491e06	Gantt Actions	schedule_change	created	Sound Check	Added "Sound Check" to Test Show	Test Show	2026-03-01 22:46:09.329273	19	[{"field":"Title","value":"Sound Check"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"10:45 PM"},{"field":"End Time","value":"11:45 PM"},{"field":"Date","value":"2026-03-01"}]
91	66bc3b91-84a7-4e45-a7dd-75443c491e06	Gantt Actions	schedule_change	created	Doors Open	Added "Doors Open" to Test Show	Test Show	2026-03-01 22:46:21.021071	19	[{"field":"Title","value":"Doors Open"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"10:46 PM"},{"field":"End Time","value":"11:46 PM"},{"field":"Date","value":"2026-03-01"}]
92	66bc3b91-84a7-4e45-a7dd-75443c491e06	Gantt Actions	schedule_change	updated	Sound Check Updated	Updated "Sound Check Updated" in Test Show	Test Show	2026-03-01 22:47:01.631027	19	[{"field":"Title","from":"Sound Check","to":"Sound Check Updated"}]
93	66bc3b91-84a7-4e45-a7dd-75443c491e06	Gantt Actions	schedule_change	deleted	Doors Open	Removed "Doors Open" from Test Show	Test Show	2026-03-01 22:47:15.451043	19	[{"field":"Title","value":"Doors Open"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"10:46 PM"},{"field":"End Time","value":"11:46 PM"},{"field":"Date","value":"2026-03-01"}]
94	66bc3b91-84a7-4e45-a7dd-75443c491e06	Gantt Actions	schedule_change	updated	Sound Check Updated	Updated "Sound Check Updated" in Test Show	Test Show	2026-03-01 22:47:24.178884	19	[{"field":"Completed","from":"No","to":"Yes"}]
95	375b35f9-dad3-4622-95cd-28b214cf12b0	Test User	schedule_change	created	Load In	Added "Load In" to My Show	My Show	2026-03-01 22:50:49.568806	20	[{"field":"Title","value":"Load In"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"9:00 AM"},{"field":"End Time","value":"11:00 AM"},{"field":"Date","value":"2026-03-01"}]
96	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Site Open / Load In	Added "Site Open / Load In" to Stage 2	Stage 2	2026-03-01 23:41:47.90154	1	[{"field":"Title","value":"Site Open / Load In"},{"field":"Category","value":"Load In"},{"field":"Start Time","value":"2:00 PM"},{"field":"End Time","value":"4:00 PM"},{"field":"Date","value":"2026-03-01"}]
97	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Sound Checks - All Stages	Added "Sound Checks - All Stages" to Stage 2	Stage 2	2026-03-01 23:41:48.233049	1	[{"field":"Title","value":"Sound Checks - All Stages"},{"field":"Category","value":"Sound Check"},{"field":"Start Time","value":"4:00 PM"},{"field":"End Time","value":"7:00 PM"},{"field":"Date","value":"2026-03-01"}]
98	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Crew Lunch	Added "Crew Lunch" to Stage 2	Stage 2	2026-03-01 23:41:48.484833	1	[{"field":"Title","value":"Crew Lunch"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"7:00 PM"},{"field":"End Time","value":"8:00 PM"},{"field":"Date","value":"2026-03-01"}]
99	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Gates Open	Added "Gates Open" to Stage 2	Stage 2	2026-03-01 23:41:48.766308	1	[{"field":"Title","value":"Gates Open"},{"field":"Category","value":"Doors Open"},{"field":"Start Time","value":"8:00 PM"},{"field":"End Time","value":"8:30 PM"},{"field":"Date","value":"2026-03-01"}]
100	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Main Stage - Act 1	Added "Main Stage - Act 1" to Stage 2	Stage 2	2026-03-01 23:41:49.036594	1	[{"field":"Title","value":"Main Stage - Act 1"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"9:00 PM"},{"field":"End Time","value":"10:00 PM"},{"field":"Date","value":"2026-03-01"}]
101	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Main Stage - Act 2	Added "Main Stage - Act 2" to Stage 2	Stage 2	2026-03-01 23:41:49.391989	1	[{"field":"Title","value":"Main Stage - Act 2"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"11:00 PM"},{"field":"End Time","value":"12:30 AM"},{"field":"Date","value":"2026-03-01"}]
102	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Crew Dinner	Added "Crew Dinner" to Stage 2	Stage 2	2026-03-01 23:41:50.072359	1	[{"field":"Title","value":"Crew Dinner"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"1:00 AM"},{"field":"End Time","value":"2:00 AM"},{"field":"Date","value":"2026-03-01"}]
103	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Headliner	Added "Headliner" to Stage 2	Stage 2	2026-03-01 23:41:50.494862	1	[{"field":"Title","value":"Headliner"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"4:00 AM"},{"field":"End Time","value":"6:00 AM"},{"field":"Date","value":"2026-03-01"}]
104	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Site Open / Load In	Added "Site Open / Load In" to Stage 3	Stage 3	2026-03-01 23:42:00.433001	1	[{"field":"Title","value":"Site Open / Load In"},{"field":"Category","value":"Load In"},{"field":"Start Time","value":"2:00 PM"},{"field":"End Time","value":"4:00 PM"},{"field":"Date","value":"2026-03-01"}]
105	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Sound Checks - All Stages	Added "Sound Checks - All Stages" to Stage 3	Stage 3	2026-03-01 23:42:00.938172	1	[{"field":"Title","value":"Sound Checks - All Stages"},{"field":"Category","value":"Sound Check"},{"field":"Start Time","value":"4:00 PM"},{"field":"End Time","value":"7:00 PM"},{"field":"Date","value":"2026-03-01"}]
106	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Crew Lunch	Added "Crew Lunch" to Stage 3	Stage 3	2026-03-01 23:42:01.363208	1	[{"field":"Title","value":"Crew Lunch"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"7:00 PM"},{"field":"End Time","value":"8:00 PM"},{"field":"Date","value":"2026-03-01"}]
107	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Gates Open	Added "Gates Open" to Stage 3	Stage 3	2026-03-01 23:42:01.861534	1	[{"field":"Title","value":"Gates Open"},{"field":"Category","value":"Doors Open"},{"field":"Start Time","value":"8:00 PM"},{"field":"End Time","value":"8:30 PM"},{"field":"Date","value":"2026-03-01"}]
108	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Main Stage - Act 1	Added "Main Stage - Act 1" to Stage 3	Stage 3	2026-03-01 23:42:02.398292	1	[{"field":"Title","value":"Main Stage - Act 1"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"9:00 PM"},{"field":"End Time","value":"10:00 PM"},{"field":"Date","value":"2026-03-01"}]
109	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Main Stage - Act 2	Added "Main Stage - Act 2" to Stage 3	Stage 3	2026-03-01 23:42:02.8258	1	[{"field":"Title","value":"Main Stage - Act 2"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"11:00 PM"},{"field":"End Time","value":"12:30 AM"},{"field":"Date","value":"2026-03-01"}]
110	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Crew Dinner	Added "Crew Dinner" to Stage 3	Stage 3	2026-03-01 23:42:03.183125	1	[{"field":"Title","value":"Crew Dinner"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"1:00 AM"},{"field":"End Time","value":"2:00 AM"},{"field":"Date","value":"2026-03-01"}]
111	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Headliner	Added "Headliner" to Stage 3	Stage 3	2026-03-01 23:42:03.584183	1	[{"field":"Title","value":"Headliner"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"4:00 AM"},{"field":"End Time","value":"6:00 AM"},{"field":"Date","value":"2026-03-01"}]
112	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Site Open / Load In	Added "Site Open / Load In" to Stage 4	Stage 4	2026-03-01 23:42:10.1561	1	[{"field":"Title","value":"Site Open / Load In"},{"field":"Category","value":"Load In"},{"field":"Start Time","value":"2:00 PM"},{"field":"End Time","value":"4:00 PM"},{"field":"Date","value":"2026-03-01"}]
113	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Sound Checks - All Stages	Added "Sound Checks - All Stages" to Stage 4	Stage 4	2026-03-01 23:42:10.599652	1	[{"field":"Title","value":"Sound Checks - All Stages"},{"field":"Category","value":"Sound Check"},{"field":"Start Time","value":"4:00 PM"},{"field":"End Time","value":"7:00 PM"},{"field":"Date","value":"2026-03-01"}]
114	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Crew Lunch	Added "Crew Lunch" to Stage 4	Stage 4	2026-03-01 23:42:10.952191	1	[{"field":"Title","value":"Crew Lunch"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"7:00 PM"},{"field":"End Time","value":"8:00 PM"},{"field":"Date","value":"2026-03-01"}]
115	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Gates Open	Added "Gates Open" to Stage 4	Stage 4	2026-03-01 23:42:11.303528	1	[{"field":"Title","value":"Gates Open"},{"field":"Category","value":"Doors Open"},{"field":"Start Time","value":"8:00 PM"},{"field":"End Time","value":"8:30 PM"},{"field":"Date","value":"2026-03-01"}]
116	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Main Stage - Act 1	Added "Main Stage - Act 1" to Stage 4	Stage 4	2026-03-01 23:42:11.722615	1	[{"field":"Title","value":"Main Stage - Act 1"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"9:00 PM"},{"field":"End Time","value":"10:00 PM"},{"field":"Date","value":"2026-03-01"}]
117	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Main Stage - Act 2	Added "Main Stage - Act 2" to Stage 4	Stage 4	2026-03-01 23:42:12.115596	1	[{"field":"Title","value":"Main Stage - Act 2"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"11:00 PM"},{"field":"End Time","value":"12:30 AM"},{"field":"Date","value":"2026-03-01"}]
118	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Crew Dinner	Added "Crew Dinner" to Stage 4	Stage 4	2026-03-01 23:42:12.460157	1	[{"field":"Title","value":"Crew Dinner"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"1:00 AM"},{"field":"End Time","value":"2:00 AM"},{"field":"Date","value":"2026-03-01"}]
119	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Headliner	Added "Headliner" to Stage 4	Stage 4	2026-03-01 23:42:12.789859	1	[{"field":"Title","value":"Headliner"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"4:00 AM"},{"field":"End Time","value":"6:00 AM"},{"field":"Date","value":"2026-03-01"}]
120	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Site Open / Load In	Added "Site Open / Load In" to Stage 1	Stage 1	2026-03-01 23:42:55.356272	1	[{"field":"Title","value":"Site Open / Load In"},{"field":"Category","value":"Load In"},{"field":"Start Time","value":"2:00 PM"},{"field":"End Time","value":"4:00 PM"},{"field":"Date","value":"2026-03-01"}]
121	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Sound Checks - All Stages	Added "Sound Checks - All Stages" to Stage 1	Stage 1	2026-03-01 23:42:56.174395	1	[{"field":"Title","value":"Sound Checks - All Stages"},{"field":"Category","value":"Sound Check"},{"field":"Start Time","value":"4:00 PM"},{"field":"End Time","value":"7:00 PM"},{"field":"Date","value":"2026-03-01"}]
122	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Crew Lunch	Added "Crew Lunch" to Stage 1	Stage 1	2026-03-01 23:42:56.946238	1	[{"field":"Title","value":"Crew Lunch"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"7:00 PM"},{"field":"End Time","value":"8:00 PM"},{"field":"Date","value":"2026-03-01"}]
123	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Gates Open	Added "Gates Open" to Stage 1	Stage 1	2026-03-01 23:42:57.697926	1	[{"field":"Title","value":"Gates Open"},{"field":"Category","value":"Doors Open"},{"field":"Start Time","value":"8:00 PM"},{"field":"End Time","value":"8:30 PM"},{"field":"Date","value":"2026-03-01"}]
124	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Main Stage - Act 1	Added "Main Stage - Act 1" to Stage 1	Stage 1	2026-03-01 23:42:58.648678	1	[{"field":"Title","value":"Main Stage - Act 1"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"9:00 PM"},{"field":"End Time","value":"10:00 PM"},{"field":"Date","value":"2026-03-01"}]
125	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Main Stage - Act 2	Added "Main Stage - Act 2" to Stage 1	Stage 1	2026-03-01 23:42:59.605137	1	[{"field":"Title","value":"Main Stage - Act 2"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"11:00 PM"},{"field":"End Time","value":"12:30 AM"},{"field":"Date","value":"2026-03-01"}]
127	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Headliner	Added "Headliner" to Stage 1	Stage 1	2026-03-01 23:43:01.761489	1	[{"field":"Title","value":"Headliner"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"4:00 AM"},{"field":"End Time","value":"6:00 AM"},{"field":"Date","value":"2026-03-01"}]
126	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Crew Dinner	Added "Crew Dinner" to Stage 1	Stage 1	2026-03-01 23:43:00.710746	1	[{"field":"Title","value":"Crew Dinner"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"1:00 AM"},{"field":"End Time","value":"2:00 AM"},{"field":"Date","value":"2026-03-01"}]
128	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	assignment_change	created	Show Assignment	Assigned crew member to "Stage 1"	Stage 1	2026-03-02 04:26:28.541989	1	[{"field":"Crew Member","value":"crew member"},{"field":"Show","value":"Stage 1"}]
129	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	assignment_change	created	Show Assignment	Assigned crew member to "Stage 1"	Stage 1	2026-03-02 04:40:56.033133	1	[{"field":"Crew Member","value":"crew member"},{"field":"Show","value":"Stage 1"}]
130	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	comment	created	Comment	DJ SoundImage commented on "Crew Call" in Camp Okizu	Camp Okizu	2026-03-02 04:43:15.965655	1	[{"field":"Comment","value":"Gxng"}]
131	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Site Open / Load In	Added "Site Open / Load In" to Stage 2	Stage 2	2026-03-02 04:44:25.011664	1	[{"field":"Title","value":"Site Open / Load In"},{"field":"Category","value":"Load In"},{"field":"Start Time","value":"2:00 PM"},{"field":"End Time","value":"4:00 PM"},{"field":"Date","value":"2026-03-02"}]
132	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Sound Checks - All Stages	Added "Sound Checks - All Stages" to Stage 2	Stage 2	2026-03-02 04:44:25.383535	1	[{"field":"Title","value":"Sound Checks - All Stages"},{"field":"Category","value":"Sound Check"},{"field":"Start Time","value":"4:00 PM"},{"field":"End Time","value":"7:00 PM"},{"field":"Date","value":"2026-03-02"}]
133	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Crew Lunch	Added "Crew Lunch" to Stage 2	Stage 2	2026-03-02 04:44:25.764101	1	[{"field":"Title","value":"Crew Lunch"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"7:00 PM"},{"field":"End Time","value":"8:00 PM"},{"field":"Date","value":"2026-03-02"}]
134	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Gates Open	Added "Gates Open" to Stage 2	Stage 2	2026-03-02 04:44:26.390406	1	[{"field":"Title","value":"Gates Open"},{"field":"Category","value":"Doors Open"},{"field":"Start Time","value":"8:00 PM"},{"field":"End Time","value":"8:30 PM"},{"field":"Date","value":"2026-03-02"}]
135	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Main Stage - Act 1	Added "Main Stage - Act 1" to Stage 2	Stage 2	2026-03-02 04:44:26.866022	1	[{"field":"Title","value":"Main Stage - Act 1"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"9:00 PM"},{"field":"End Time","value":"10:00 PM"},{"field":"Date","value":"2026-03-02"}]
136	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Main Stage - Act 2	Added "Main Stage - Act 2" to Stage 2	Stage 2	2026-03-02 04:44:27.331555	1	[{"field":"Title","value":"Main Stage - Act 2"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"11:00 PM"},{"field":"End Time","value":"12:30 AM"},{"field":"Date","value":"2026-03-02"}]
137	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Crew Dinner	Added "Crew Dinner" to Stage 2	Stage 2	2026-03-02 04:44:27.788734	1	[{"field":"Title","value":"Crew Dinner"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"1:00 AM"},{"field":"End Time","value":"2:00 AM"},{"field":"Date","value":"2026-03-02"}]
138	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Headliner	Added "Headliner" to Stage 2	Stage 2	2026-03-02 04:44:28.156711	1	[{"field":"Title","value":"Headliner"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"4:00 AM"},{"field":"End Time","value":"6:00 AM"},{"field":"Date","value":"2026-03-02"}]
139	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	deleted	DAY 1	Removed "DAY 1" from Camp Okizu	Camp Okizu	2026-03-02 10:53:55.091715	1	[{"field":"Title","value":"DAY 1"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"7:00 AM"},{"field":"End Time","value":"6:55 AM"},{"field":"Date","value":"2026-03-13"}]
140	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	updated	Prep Control and Live Auction Pa	Updated "Prep Control and Live Auction Pa" in Camp Okizu	Camp Okizu	2026-03-02 11:06:40.162989	1	[{"field":"Start Time","from":"5:00 PM","to":"4:00 PM"}]
141	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Site Open / Load In	Added "Site Open / Load In" to Stage 3	Stage 3	2026-03-02 14:17:32.864807	1	[{"field":"Title","value":"Site Open / Load In"},{"field":"Category","value":"Load In"},{"field":"Start Time","value":"2:00 PM"},{"field":"End Time","value":"4:00 PM"},{"field":"Date","value":"2026-03-02"}]
142	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Sound Checks - All Stages	Added "Sound Checks - All Stages" to Stage 3	Stage 3	2026-03-02 14:17:33.395363	1	[{"field":"Title","value":"Sound Checks - All Stages"},{"field":"Category","value":"Sound Check"},{"field":"Start Time","value":"4:00 PM"},{"field":"End Time","value":"7:00 PM"},{"field":"Date","value":"2026-03-02"}]
143	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Crew Lunch	Added "Crew Lunch" to Stage 3	Stage 3	2026-03-02 14:17:33.801953	1	[{"field":"Title","value":"Crew Lunch"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"7:00 PM"},{"field":"End Time","value":"8:00 PM"},{"field":"Date","value":"2026-03-02"}]
144	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Gates Open	Added "Gates Open" to Stage 3	Stage 3	2026-03-02 14:17:34.206878	1	[{"field":"Title","value":"Gates Open"},{"field":"Category","value":"Doors Open"},{"field":"Start Time","value":"8:00 PM"},{"field":"End Time","value":"8:30 PM"},{"field":"Date","value":"2026-03-02"}]
145	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Main Stage - Act 1	Added "Main Stage - Act 1" to Stage 3	Stage 3	2026-03-02 14:17:34.570769	1	[{"field":"Title","value":"Main Stage - Act 1"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"9:00 PM"},{"field":"End Time","value":"10:00 PM"},{"field":"Date","value":"2026-03-02"}]
146	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Main Stage - Act 2	Added "Main Stage - Act 2" to Stage 3	Stage 3	2026-03-02 14:17:34.976044	1	[{"field":"Title","value":"Main Stage - Act 2"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"11:00 PM"},{"field":"End Time","value":"12:30 AM"},{"field":"Date","value":"2026-03-02"}]
147	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Crew Dinner	Added "Crew Dinner" to Stage 3	Stage 3	2026-03-02 14:17:35.316504	1	[{"field":"Title","value":"Crew Dinner"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"1:00 AM"},{"field":"End Time","value":"2:00 AM"},{"field":"Date","value":"2026-03-02"}]
148	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Headliner	Added "Headliner" to Stage 3	Stage 3	2026-03-02 14:17:35.635985	1	[{"field":"Title","value":"Headliner"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"4:00 AM"},{"field":"End Time","value":"6:00 AM"},{"field":"Date","value":"2026-03-02"}]
149	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Site Open / Load In	Added "Site Open / Load In" to Stage 4	Stage 4	2026-03-02 14:17:46.483873	1	[{"field":"Title","value":"Site Open / Load In"},{"field":"Category","value":"Load In"},{"field":"Start Time","value":"2:00 PM"},{"field":"End Time","value":"4:00 PM"},{"field":"Date","value":"2026-03-02"}]
150	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Sound Checks - All Stages	Added "Sound Checks - All Stages" to Stage 4	Stage 4	2026-03-02 14:17:46.975827	1	[{"field":"Title","value":"Sound Checks - All Stages"},{"field":"Category","value":"Sound Check"},{"field":"Start Time","value":"4:00 PM"},{"field":"End Time","value":"7:00 PM"},{"field":"Date","value":"2026-03-02"}]
151	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Crew Lunch	Added "Crew Lunch" to Stage 4	Stage 4	2026-03-02 14:17:47.456196	1	[{"field":"Title","value":"Crew Lunch"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"7:00 PM"},{"field":"End Time","value":"8:00 PM"},{"field":"Date","value":"2026-03-02"}]
152	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Gates Open	Added "Gates Open" to Stage 4	Stage 4	2026-03-02 14:17:47.81967	1	[{"field":"Title","value":"Gates Open"},{"field":"Category","value":"Doors Open"},{"field":"Start Time","value":"8:00 PM"},{"field":"End Time","value":"8:30 PM"},{"field":"Date","value":"2026-03-02"}]
153	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Main Stage - Act 1	Added "Main Stage - Act 1" to Stage 4	Stage 4	2026-03-02 14:17:48.126511	1	[{"field":"Title","value":"Main Stage - Act 1"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"9:00 PM"},{"field":"End Time","value":"10:00 PM"},{"field":"Date","value":"2026-03-02"}]
154	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Main Stage - Act 2	Added "Main Stage - Act 2" to Stage 4	Stage 4	2026-03-02 14:17:48.643254	1	[{"field":"Title","value":"Main Stage - Act 2"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"11:00 PM"},{"field":"End Time","value":"12:30 AM"},{"field":"Date","value":"2026-03-02"}]
155	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Crew Dinner	Added "Crew Dinner" to Stage 4	Stage 4	2026-03-02 14:17:49.128237	1	[{"field":"Title","value":"Crew Dinner"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"1:00 AM"},{"field":"End Time","value":"2:00 AM"},{"field":"Date","value":"2026-03-02"}]
156	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Headliner	Added "Headliner" to Stage 4	Stage 4	2026-03-02 14:17:49.672761	1	[{"field":"Title","value":"Headliner"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"4:00 AM"},{"field":"End Time","value":"6:00 AM"},{"field":"Date","value":"2026-03-02"}]
157	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Load In	Added "Load In" to Berkeley,Ca	Berkeley,Ca	2026-03-02 15:24:28.459622	1	[{"field":"Title","value":"Load In"},{"field":"Category","value":"Load In"},{"field":"Start Time","value":"3:00 PM"},{"field":"End Time","value":"5:00 PM"},{"field":"Date","value":"2026-03-09"}]
158	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Stage Setup	Added "Stage Setup" to Berkeley,Ca	Berkeley,Ca	2026-03-02 15:24:28.952239	1	[{"field":"Title","value":"Stage Setup"},{"field":"Category","value":"Load In"},{"field":"Start Time","value":"5:00 PM"},{"field":"End Time","value":"7:00 PM"},{"field":"Date","value":"2026-03-09"}]
159	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Lunch	Added "Lunch" to Berkeley,Ca	Berkeley,Ca	2026-03-02 15:24:29.599618	1	[{"field":"Title","value":"Lunch"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"7:00 PM"},{"field":"End Time","value":"8:00 PM"},{"field":"Date","value":"2026-03-09"}]
160	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Sound Check	Added "Sound Check" to Berkeley,Ca	Berkeley,Ca	2026-03-02 15:24:30.094326	1	[{"field":"Title","value":"Sound Check"},{"field":"Category","value":"Sound Check"},{"field":"Start Time","value":"9:00 PM"},{"field":"End Time","value":"11:00 PM"},{"field":"Date","value":"2026-03-09"}]
161	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Dinner	Added "Dinner" to Berkeley,Ca	Berkeley,Ca	2026-03-02 15:24:30.353029	1	[{"field":"Title","value":"Dinner"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"12:00 AM"},{"field":"End Time","value":"1:00 AM"},{"field":"Date","value":"2026-03-09"}]
162	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Doors Open	Added "Doors Open" to Berkeley,Ca	Berkeley,Ca	2026-03-02 15:24:30.98555	1	[{"field":"Title","value":"Doors Open"},{"field":"Category","value":"Doors Open"},{"field":"Start Time","value":"2:00 AM"},{"field":"End Time","value":"2:30 AM"},{"field":"Date","value":"2026-03-09"}]
163	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Show	Added "Show" to Berkeley,Ca	Berkeley,Ca	2026-03-02 15:24:31.560982	1	[{"field":"Title","value":"Show"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"3:00 AM"},{"field":"End Time","value":"5:00 AM"},{"field":"Date","value":"2026-03-09"}]
164	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Show	Added "Show" to Stage 1	Stage 1	2026-03-03 00:29:02.531653	1	[{"field":"Category","value":"Show"},{"field":"Start Time","value":"12:28 AM"},{"field":"End Time","value":"1:28 AM"},{"field":"Date","value":"2026-03-02"}]
165	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	deleted	Show	Removed "Show" from Stage 1	Stage 1	2026-03-03 00:29:11.679884	1	[{"field":"Category","value":"Show"},{"field":"Start Time","value":"12:28 AM"},{"field":"End Time","value":"1:28 AM"},{"field":"Date","value":"2026-03-02"}]
166	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	updated	Prep Control and Live Auction Pa	Updated "Prep Control and Live Auction Pa" in Camp Okizu	Camp Okizu	2026-03-03 05:19:57.564989	1	\N
167	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Load In	Added "Load In" to Berkeley,Ca	Berkeley,Ca	2026-03-03 16:46:20.362743	1	[{"field":"Title","value":"Load In"},{"field":"Category","value":"Load In"},{"field":"Start Time","value":"3:00 PM"},{"field":"End Time","value":"5:00 PM"},{"field":"Date","value":"2026-03-11"}]
168	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Stage Setup	Added "Stage Setup" to Berkeley,Ca	Berkeley,Ca	2026-03-03 16:46:20.658544	1	[{"field":"Title","value":"Stage Setup"},{"field":"Category","value":"Load In"},{"field":"Start Time","value":"5:00 PM"},{"field":"End Time","value":"7:00 PM"},{"field":"Date","value":"2026-03-11"}]
169	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Lunch	Added "Lunch" to Berkeley,Ca	Berkeley,Ca	2026-03-03 16:46:21.102113	1	[{"field":"Title","value":"Lunch"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"7:00 PM"},{"field":"End Time","value":"8:00 PM"},{"field":"Date","value":"2026-03-11"}]
170	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Sound Check	Added "Sound Check" to Berkeley,Ca	Berkeley,Ca	2026-03-03 16:46:21.591849	1	[{"field":"Title","value":"Sound Check"},{"field":"Category","value":"Sound Check"},{"field":"Start Time","value":"9:00 PM"},{"field":"End Time","value":"11:00 PM"},{"field":"Date","value":"2026-03-11"}]
171	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Dinner	Added "Dinner" to Berkeley,Ca	Berkeley,Ca	2026-03-03 16:46:22.130695	1	[{"field":"Title","value":"Dinner"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"12:00 AM"},{"field":"End Time","value":"1:00 AM"},{"field":"Date","value":"2026-03-11"}]
172	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Doors Open	Added "Doors Open" to Berkeley,Ca	Berkeley,Ca	2026-03-03 16:46:22.642647	1	[{"field":"Title","value":"Doors Open"},{"field":"Category","value":"Doors Open"},{"field":"Start Time","value":"2:00 AM"},{"field":"End Time","value":"2:30 AM"},{"field":"Date","value":"2026-03-11"}]
173	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Show	Added "Show" to Berkeley,Ca	Berkeley,Ca	2026-03-03 16:46:23.120946	1	[{"field":"Title","value":"Show"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"3:00 AM"},{"field":"End Time","value":"5:00 AM"},{"field":"Date","value":"2026-03-11"}]
174	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Load In	Added "Load In" to Berkeley,Ca	Berkeley,Ca	2026-03-03 16:48:15.383898	1	[{"field":"Title","value":"Load In"},{"field":"Category","value":"Load In"},{"field":"Start Time","value":"3:00 PM"},{"field":"Date","value":"2026-03-11"}]
175	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	deleted	Load In	Removed "Load In" from Berkeley,Ca	Berkeley,Ca	2026-03-03 16:48:27.250165	1	[{"field":"Title","value":"Load In"},{"field":"Category","value":"Load In"},{"field":"Start Time","value":"3:00 PM"},{"field":"Date","value":"2026-03-11"}]
176	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Load In	Added "Load In" to Los Angeles	Los Angeles	2026-03-03 17:24:47.587617	1	[{"field":"Title","value":"Load In"},{"field":"Category","value":"Load In"},{"field":"Start Time","value":"3:00 PM"},{"field":"End Time","value":"5:00 PM"},{"field":"Date","value":"2026-03-11"}]
177	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Stage Setup	Added "Stage Setup" to Los Angeles	Los Angeles	2026-03-03 17:24:47.927941	1	[{"field":"Title","value":"Stage Setup"},{"field":"Category","value":"Load In"},{"field":"Start Time","value":"5:00 PM"},{"field":"End Time","value":"7:00 PM"},{"field":"Date","value":"2026-03-11"}]
178	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Lunch	Added "Lunch" to Los Angeles	Los Angeles	2026-03-03 17:24:48.111253	1	[{"field":"Title","value":"Lunch"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"7:00 PM"},{"field":"End Time","value":"8:00 PM"},{"field":"Date","value":"2026-03-11"}]
179	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Sound Check	Added "Sound Check" to Los Angeles	Los Angeles	2026-03-03 17:24:48.375419	1	[{"field":"Title","value":"Sound Check"},{"field":"Category","value":"Sound Check"},{"field":"Start Time","value":"9:00 PM"},{"field":"End Time","value":"11:00 PM"},{"field":"Date","value":"2026-03-11"}]
180	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Dinner	Added "Dinner" to Los Angeles	Los Angeles	2026-03-03 17:24:48.670278	1	[{"field":"Title","value":"Dinner"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"12:00 AM"},{"field":"End Time","value":"1:00 AM"},{"field":"Date","value":"2026-03-11"}]
181	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Doors Open	Added "Doors Open" to Los Angeles	Los Angeles	2026-03-03 17:24:49.050837	1	[{"field":"Title","value":"Doors Open"},{"field":"Category","value":"Doors Open"},{"field":"Start Time","value":"2:00 AM"},{"field":"End Time","value":"2:30 AM"},{"field":"Date","value":"2026-03-11"}]
182	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Show	Added "Show" to Los Angeles	Los Angeles	2026-03-03 17:24:49.324153	1	[{"field":"Title","value":"Show"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"3:00 AM"},{"field":"End Time","value":"5:00 AM"},{"field":"Date","value":"2026-03-11"}]
183	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Load In	Added "Load In" to San Francisco	San Francisco	2026-03-03 17:24:55.483532	1	[{"field":"Title","value":"Load In"},{"field":"Category","value":"Load In"},{"field":"Start Time","value":"3:00 PM"},{"field":"End Time","value":"5:00 PM"},{"field":"Date","value":"2026-03-13"}]
184	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Stage Setup	Added "Stage Setup" to San Francisco	San Francisco	2026-03-03 17:24:55.743844	1	[{"field":"Title","value":"Stage Setup"},{"field":"Category","value":"Load In"},{"field":"Start Time","value":"5:00 PM"},{"field":"End Time","value":"7:00 PM"},{"field":"Date","value":"2026-03-13"}]
185	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Lunch	Added "Lunch" to San Francisco	San Francisco	2026-03-03 17:24:55.949739	1	[{"field":"Title","value":"Lunch"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"7:00 PM"},{"field":"End Time","value":"8:00 PM"},{"field":"Date","value":"2026-03-13"}]
186	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Sound Check	Added "Sound Check" to San Francisco	San Francisco	2026-03-03 17:24:56.264659	1	[{"field":"Title","value":"Sound Check"},{"field":"Category","value":"Sound Check"},{"field":"Start Time","value":"9:00 PM"},{"field":"End Time","value":"11:00 PM"},{"field":"Date","value":"2026-03-13"}]
187	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Dinner	Added "Dinner" to San Francisco	San Francisco	2026-03-03 17:24:56.50811	1	[{"field":"Title","value":"Dinner"},{"field":"Category","value":"Meal"},{"field":"Start Time","value":"12:00 AM"},{"field":"End Time","value":"1:00 AM"},{"field":"Date","value":"2026-03-13"}]
188	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Doors Open	Added "Doors Open" to San Francisco	San Francisco	2026-03-03 17:24:56.844014	1	[{"field":"Title","value":"Doors Open"},{"field":"Category","value":"Doors Open"},{"field":"Start Time","value":"2:00 AM"},{"field":"End Time","value":"2:30 AM"},{"field":"Date","value":"2026-03-13"}]
189	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	schedule_change	created	Show	Added "Show" to San Francisco	San Francisco	2026-03-03 17:24:57.096562	1	[{"field":"Title","value":"Show"},{"field":"Category","value":"Show"},{"field":"Start Time","value":"3:00 AM"},{"field":"End Time","value":"5:00 AM"},{"field":"Date","value":"2026-03-13"}]
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.comments (id, schedule_id, author_id, author_name, body, created_at, workspace_id, pinned) FROM stdin;
1	77	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	TRUCK DRIVER ON SITE @ 6PM XXX-XXX-XXXX	2026-02-10 01:33:39.024713	1	f
2	238	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	Register at the check in booth upon entry	2026-02-11 23:40:40.778877	1	t
3	238	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	Yooooo	2026-02-11 23:49:47.202563	1	f
4	238	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	here we go	2026-02-11 23:49:50.153958	1	f
5	238	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	lets	2026-02-11 23:49:54.099064	1	f
6	238	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	have fun	2026-02-11 23:49:56.002545	1	f
7	241	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	Band sucked	2026-02-11 23:51:01.520591	1	f
8	244	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	they actually apleyed good	2026-02-11 23:51:10.504634	1	f
9	245	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	Jalen You  ahoe	2026-02-12 00:50:08.196325	1	f
10	314	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	Was Beef and Chicken who woulda thought	2026-02-12 01:22:32.371915	1	f
11	450	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	Rig should be flown and component tested	2026-02-12 22:20:22.357322	1	f
12	448	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	Start with power. Get the snake started asap.	2026-02-12 22:26:06.796271	1	f
13	449	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	There is a Safeway just a short walk away, or figure it out on your own	2026-02-12 22:26:45.077916	1	f
14	465	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	Please arrive onsite well fed no meals til dinner.	2026-02-12 22:27:18.155643	1	f
15	466	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	Auctioneer to walk through his slides quickly to get a feel for the room	2026-02-12 22:29:32.621859	1	f
16	468	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	Have a good show	2026-02-12 22:29:51.01808	1	f
17	467	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	Break a leg! take Pics!	2026-02-12 22:30:02.999827	1	f
19	628	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	Yoooo	2026-02-26 14:39:49.023513	1	f
20	465	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	Gxng	2026-03-02 04:43:15.951712	1	f
\.


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contacts (id, role, email, phone, notes, user_id, first_name, last_name, workspace_id, contact_type) FROM stdin;
329	AUDIO	ganttactions@example.com	(555) 000-0000	\N	66bc3b91-84a7-4e45-a7dd-75443c491e06	Gantt	Actions	19	crew
330	AUDIO	ganttv2@example.com	\N	\N	375b35f9-dad3-4622-95cd-28b214cf12b0	Test	User	20	crew
332	PRODUCTION	auto.tester@example.com	\N	\N	ed37a8b1-2c28-4a1d-b3ad-f5cb04fcddd8	Auto	Tester	21	crew
333	PRODUCTION	test-bulk-tour-user@example.com	(555) 123-4567	\N	a2dd2849-6a4d-4ae3-8a0f-1ee6e86990cc	BulkTour	Tester	25	crew
312	Venue		+14153457500		\N	FORT MASON		1	crew
314	Venue	\N	+14153457500	\N	\N	N/A	\N	1	crew
311	Venue	\N	14156371662	\N	\N	Jon	G	1	crew
308	AUDIO, Account Manager	dj.soundimage@gmail.com	5106914462		3e0cd90d-a738-4680-b7e2-443887d0cc2c	Drew	Johnson	1	crew
313	Venue		+15101231234		\N	Jason	Blackwell	1	crew
320	PRODUCTION	manager@example.com	\N	\N	30e4fcb2-dbbd-4681-a626-9e9c8b90f42f	Manager	User	11	crew
321	PRODUCTION	noHqYu@example.com	(555) 123-4567	\N	a7b98857-1865-468a-a36e-3cc5e98bf995	Manager	User	12	crew
323	AUDIO	testmgr@example.com	\N	\N	21170168-f9d5-4032-820c-6063f1b02366	Test	Manager	13	crew
325	Crew	alice.crew+test@example.com	(555) 111-2222	\N	\N	Alice	Crew	13	crew
326	PRODUCTION	scrolltest@example.com	\N	\N	67896a15-8973-4ab8-a87d-db8f63fe6ed4	Scroll	Tester	16	crew
327	PRODUCTION	ganttdetail@example.com	(555) 555-0101	\N	8e2a0d5c-8781-4efd-9713-8aeb6ef1e00f	Gantt	Tester	17	crew
328	AUDIO	ganttdetail2@example.com	\N	\N	dad5d4d8-5808-4dbe-b304-af6e142895fb	Gantt	Tester2	18	crew
\.


--
-- Data for Name: crew_positions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.crew_positions (id, name, is_default, workspace_id) FROM stdin;
1	FOH	t	1
2	MONS	t	1
3	A1	t	1
4	A2	t	1
5	LD	t	1
6	SPOT	t	1
7	V1	t	1
8	V2	t	1
9	PATCH	t	1
10	STAGE	t	1
11	BACKLINE	t	1
12	TM	t	1
13	PM	t	1
14	SM	t	1
15	TD	t	1
16	RIGGER	t	1
17	CARP	t	1
18	WARDROBE	t	1
19	PROPS	t	1
20	SFX	t	1
21	FOH/SYSTECH	f	1
22	Acct Manager	f	1
23	FOH	t	10
24	MONS	t	10
25	A1	t	10
26	A2	t	10
27	LD	t	10
28	SPOT	t	10
29	V1	t	10
30	V2	t	10
31	PATCH	t	10
32	STAGE	t	10
33	BACKLINE	t	10
34	TM	t	10
35	PM	t	10
36	SM	t	10
37	TD	t	10
38	RIGGER	t	10
39	CARP	t	10
40	WARDROBE	t	10
41	PROPS	t	10
42	SFX	t	10
43	FOH	t	11
44	MONS	t	11
45	A1	t	11
46	A2	t	11
47	LD	t	11
48	SPOT	t	11
49	V1	t	11
50	V2	t	11
51	PATCH	t	11
52	STAGE	t	11
53	BACKLINE	t	11
54	TM	t	11
55	PM	t	11
56	SM	t	11
57	TD	t	11
58	RIGGER	t	11
59	CARP	t	11
60	WARDROBE	t	11
61	PROPS	t	11
62	SFX	t	11
63	FOH	t	12
64	MONS	t	12
65	A1	t	12
66	A2	t	12
67	LD	t	12
68	SPOT	t	12
69	V1	t	12
70	V2	t	12
71	PATCH	t	12
72	STAGE	t	12
73	BACKLINE	t	12
74	TM	t	12
75	PM	t	12
76	SM	t	12
77	TD	t	12
78	RIGGER	t	12
79	CARP	t	12
80	WARDROBE	t	12
81	PROPS	t	12
82	SFX	t	12
83	FOH	t	13
84	MONS	t	13
85	A1	t	13
86	A2	t	13
87	LD	t	13
88	SPOT	t	13
89	V1	t	13
90	V2	t	13
91	PATCH	t	13
92	STAGE	t	13
93	BACKLINE	t	13
94	TM	t	13
95	PM	t	13
96	SM	t	13
97	TD	t	13
98	RIGGER	t	13
99	CARP	t	13
100	WARDROBE	t	13
101	PROPS	t	13
102	SFX	t	13
103	FOH	t	15
104	MONS	t	15
105	A1	t	15
106	A2	t	15
107	LD	t	15
108	SPOT	t	15
109	V1	t	15
110	V2	t	15
111	PATCH	t	15
112	STAGE	t	15
113	BACKLINE	t	15
114	TM	t	15
115	PM	t	15
116	SM	t	15
117	TD	t	15
118	RIGGER	t	15
119	CARP	t	15
120	WARDROBE	t	15
121	PROPS	t	15
122	SFX	t	15
123	FOH	t	16
124	MONS	t	16
125	A1	t	16
126	A2	t	16
127	LD	t	16
128	SPOT	t	16
129	V1	t	16
130	V2	t	16
131	PATCH	t	16
132	STAGE	t	16
133	BACKLINE	t	16
134	TM	t	16
135	PM	t	16
136	SM	t	16
137	TD	t	16
138	RIGGER	t	16
139	CARP	t	16
140	WARDROBE	t	16
141	PROPS	t	16
142	SFX	t	16
143	FOH	t	17
144	MONS	t	17
145	A1	t	17
146	A2	t	17
147	LD	t	17
148	SPOT	t	17
149	V1	t	17
150	V2	t	17
151	PATCH	t	17
152	STAGE	t	17
153	BACKLINE	t	17
154	TM	t	17
155	PM	t	17
156	SM	t	17
157	TD	t	17
158	RIGGER	t	17
159	CARP	t	17
160	WARDROBE	t	17
161	PROPS	t	17
162	SFX	t	17
163	FOH	t	18
164	MONS	t	18
165	A1	t	18
166	A2	t	18
167	LD	t	18
168	SPOT	t	18
169	V1	t	18
170	V2	t	18
171	PATCH	t	18
172	STAGE	t	18
173	BACKLINE	t	18
174	TM	t	18
175	PM	t	18
176	SM	t	18
177	TD	t	18
178	RIGGER	t	18
179	CARP	t	18
180	WARDROBE	t	18
181	PROPS	t	18
182	SFX	t	18
183	FOH	t	19
184	MONS	t	19
185	A1	t	19
186	A2	t	19
187	LD	t	19
188	SPOT	t	19
189	V1	t	19
190	V2	t	19
191	PATCH	t	19
192	STAGE	t	19
193	BACKLINE	t	19
194	TM	t	19
195	PM	t	19
196	SM	t	19
197	TD	t	19
198	RIGGER	t	19
199	CARP	t	19
200	WARDROBE	t	19
201	PROPS	t	19
202	SFX	t	19
203	FOH	t	20
204	MONS	t	20
205	A1	t	20
206	A2	t	20
207	LD	t	20
208	SPOT	t	20
209	V1	t	20
210	V2	t	20
211	PATCH	t	20
212	STAGE	t	20
213	BACKLINE	t	20
214	TM	t	20
215	PM	t	20
216	SM	t	20
217	TD	t	20
218	RIGGER	t	20
219	CARP	t	20
220	WARDROBE	t	20
221	PROPS	t	20
222	SFX	t	20
223	FOH	t	21
224	MONS	t	21
225	A1	t	21
226	A2	t	21
227	LD	t	21
228	SPOT	t	21
229	V1	t	21
230	V2	t	21
231	PATCH	t	21
232	STAGE	t	21
233	BACKLINE	t	21
234	TM	t	21
235	PM	t	21
236	SM	t	21
237	TD	t	21
238	RIGGER	t	21
239	CARP	t	21
240	WARDROBE	t	21
241	PROPS	t	21
242	SFX	t	21
243	FOH	t	24
244	MONS	t	24
245	A1	t	24
246	A2	t	24
247	LD	t	24
248	SPOT	t	24
249	V1	t	24
250	V2	t	24
251	PATCH	t	24
252	STAGE	t	24
253	BACKLINE	t	24
254	TM	t	24
255	PM	t	24
256	SM	t	24
257	TD	t	24
258	RIGGER	t	24
259	CARP	t	24
260	WARDROBE	t	24
261	PROPS	t	24
262	SFX	t	24
263	FOH	t	25
264	MONS	t	25
265	A1	t	25
266	A2	t	25
267	LD	t	25
268	SPOT	t	25
269	V1	t	25
270	V2	t	25
271	PATCH	t	25
272	STAGE	t	25
273	BACKLINE	t	25
274	TM	t	25
275	PM	t	25
276	SM	t	25
277	TD	t	25
278	RIGGER	t	25
279	CARP	t	25
280	WARDROBE	t	25
281	PROPS	t	25
282	SFX	t	25
\.


--
-- Data for Name: crew_travel; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.crew_travel (id, travel_day_id, user_id, flight_number, airline, departure_airport, arrival_airport, departure_time, arrival_time, hotel_name, hotel_address, hotel_check_in, hotel_check_out, ground_transport, notes, workspace_id) FROM stdin;
2	3	154921bc-c1b2-42ee-8a07-4722ef256140	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1
3	3	3e0cd90d-a738-4680-b7e2-443887d0cc2c	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1
4	3	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1
5	5	fb7e64ae-5e69-4176-baa5-767c7fb7662d	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1
6	5	154921bc-c1b2-42ee-8a07-4722ef256140	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1
7	5	3e0cd90d-a738-4680-b7e2-443887d0cc2c	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1
8	5	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1
9	2	fb7e64ae-5e69-4176-baa5-767c7fb7662d	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1
10	2	154921bc-c1b2-42ee-8a07-4722ef256140	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1
11	2	3e0cd90d-a738-4680-b7e2-443887d0cc2c	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1
12	2	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1
13	4	fb7e64ae-5e69-4176-baa5-767c7fb7662d	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1
14	4	154921bc-c1b2-42ee-8a07-4722ef256140	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1
15	4	3e0cd90d-a738-4680-b7e2-443887d0cc2c	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1
16	4	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1
22	6	fb7e64ae-5e69-4176-baa5-767c7fb7662d	Dndnnccn	Jfhdncnc	DHDB	FJDJ	00:00	01:00	Tj fn dnnccj	Dndndbcb	2026-03-02	2026-03-02	Cncnncncc	\N	1
23	6	3e0cd90d-a738-4680-b7e2-443887d0cc2c	Xxxqqww	United 	LAX	SFO	04:20	05:30	Hilton	123 Grant 	2026-03-08	2026-03-09	Rental Car 	Under Drew Johnson’s name. 	1
\.


--
-- Data for Name: daily_checkins; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.daily_checkins (id, user_id, event_name, date, checked_in_at, checked_out_at, workspace_id) FROM stdin;
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.departments (id, name, is_default, workspace_id) FROM stdin;
1	Band	t	1
2	Crew	t	1
3	Client	t	1
4	Venue	t	1
5	Management	t	1
7	Lighting	t	1
8	Video	t	1
9	Backline	t	1
10	Catering	t	1
11	Security	t	1
12	Production	t	1
13	FOH	t	1
15	Stagehand	t	1
16	Rigging	t	1
17	Transport	t	1
6	Audio	t	1
18	Warehouse	f	1
19	Account Manager	f	1
14	MONS	t	1
20	Band	t	10
21	Crew	t	10
22	Client	t	10
23	Venue	t	10
24	Management	t	10
25	Audio	t	10
26	Lighting	t	10
27	Video	t	10
28	Backline	t	10
29	Catering	t	10
30	Security	t	10
31	Production	t	10
32	FOH	t	10
33	Monitor	t	10
34	Stagehand	t	10
35	Rigging	t	10
36	Transport	t	10
37	Band	t	11
38	Crew	t	11
39	Client	t	11
40	Venue	t	11
41	Management	t	11
42	Audio	t	11
43	Lighting	t	11
44	Video	t	11
45	Backline	t	11
46	Catering	t	11
47	Security	t	11
48	Production	t	11
49	FOH	t	11
50	Monitor	t	11
51	Stagehand	t	11
52	Rigging	t	11
53	Transport	t	11
54	Band	t	12
55	Crew	t	12
56	Client	t	12
57	Venue	t	12
58	Management	t	12
59	Audio	t	12
60	Lighting	t	12
61	Video	t	12
62	Backline	t	12
63	Catering	t	12
64	Security	t	12
65	Production	t	12
66	FOH	t	12
67	Monitor	t	12
68	Stagehand	t	12
69	Rigging	t	12
70	Transport	t	12
71	Band	t	13
72	Crew	t	13
73	Client	t	13
74	Venue	t	13
75	Management	t	13
76	Audio	t	13
77	Lighting	t	13
78	Video	t	13
79	Backline	t	13
80	Catering	t	13
81	Security	t	13
82	Production	t	13
83	FOH	t	13
84	Monitor	t	13
85	Stagehand	t	13
86	Rigging	t	13
87	Transport	t	13
88	Band	t	15
89	Crew	t	15
90	Client	t	15
91	Venue	t	15
92	Management	t	15
93	Audio	t	15
94	Lighting	t	15
95	Video	t	15
96	Backline	t	15
97	Catering	t	15
98	Security	t	15
99	Production	t	15
100	FOH	t	15
101	Monitor	t	15
102	Stagehand	t	15
103	Rigging	t	15
104	Transport	t	15
105	Band	t	16
106	Crew	t	16
107	Client	t	16
108	Venue	t	16
109	Management	t	16
110	Audio	t	16
111	Lighting	t	16
112	Video	t	16
113	Backline	t	16
114	Catering	t	16
115	Security	t	16
116	Production	t	16
117	FOH	t	16
118	Monitor	t	16
119	Stagehand	t	16
120	Rigging	t	16
121	Transport	t	16
122	Band	t	17
123	Crew	t	17
124	Client	t	17
125	Venue	t	17
126	Management	t	17
127	Audio	t	17
128	Lighting	t	17
129	Video	t	17
130	Backline	t	17
131	Catering	t	17
132	Security	t	17
133	Production	t	17
134	FOH	t	17
135	Monitor	t	17
136	Stagehand	t	17
137	Rigging	t	17
138	Transport	t	17
139	Band	t	18
140	Crew	t	18
141	Client	t	18
142	Venue	t	18
143	Management	t	18
144	Audio	t	18
145	Lighting	t	18
146	Video	t	18
147	Backline	t	18
148	Catering	t	18
149	Security	t	18
150	Production	t	18
151	FOH	t	18
152	Monitor	t	18
153	Stagehand	t	18
154	Rigging	t	18
155	Transport	t	18
156	Band	t	19
157	Crew	t	19
158	Client	t	19
159	Venue	t	19
160	Management	t	19
161	Audio	t	19
162	Lighting	t	19
163	Video	t	19
164	Backline	t	19
165	Catering	t	19
166	Security	t	19
167	Production	t	19
168	FOH	t	19
169	Monitor	t	19
170	Stagehand	t	19
171	Rigging	t	19
172	Transport	t	19
173	Band	t	20
174	Crew	t	20
175	Client	t	20
176	Venue	t	20
177	Management	t	20
178	Audio	t	20
179	Lighting	t	20
180	Video	t	20
181	Backline	t	20
182	Catering	t	20
183	Security	t	20
184	Production	t	20
185	FOH	t	20
186	Monitor	t	20
187	Stagehand	t	20
188	Rigging	t	20
189	Transport	t	20
190	Band	t	21
191	Crew	t	21
192	Client	t	21
193	Venue	t	21
194	Management	t	21
195	Audio	t	21
196	Lighting	t	21
197	Video	t	21
198	Backline	t	21
199	Catering	t	21
200	Security	t	21
201	Production	t	21
202	FOH	t	21
203	Monitor	t	21
204	Stagehand	t	21
205	Rigging	t	21
206	Transport	t	21
207	Band	t	24
208	Crew	t	24
209	Client	t	24
210	Venue	t	24
211	Management	t	24
212	Audio	t	24
213	Lighting	t	24
214	Video	t	24
215	Backline	t	24
216	Catering	t	24
217	Security	t	24
218	Production	t	24
219	FOH	t	24
220	Monitor	t	24
221	Stagehand	t	24
222	Rigging	t	24
223	Transport	t	24
224	Band	t	25
225	Crew	t	25
226	Client	t	25
227	Venue	t	25
228	Management	t	25
229	Audio	t	25
230	Lighting	t	25
231	Video	t	25
232	Backline	t	25
233	Catering	t	25
234	Security	t	25
235	Production	t	25
236	FOH	t	25
237	Monitor	t	25
238	Stagehand	t	25
239	Rigging	t	25
240	Transport	t	25
\.


--
-- Data for Name: event_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.event_assignments (id, user_id, event_name, workspace_id, "position", checked_in_at) FROM stdin;
17	3e0cd90d-a738-4680-b7e2-443887d0cc2c	Microsoft at Filoli	1	\N	\N
20	3e0cd90d-a738-4680-b7e2-443887d0cc2c	First Show - FEB 13	1	\N	\N
47	3e0cd90d-a738-4680-b7e2-443887d0cc2c	Emperor Spring CA Tour - Show 3	1	\N	\N
51	3e0cd90d-a738-4680-b7e2-443887d0cc2c	Emperor Spring CA Tour - Show 4	1	\N	\N
55	3e0cd90d-a738-4680-b7e2-443887d0cc2c	Emperor Spring CA Tour - Show 5	1	\N	\N
59	3e0cd90d-a738-4680-b7e2-443887d0cc2c	Emperor Spring CA Tour - Show 6	1	\N	\N
29	cbd4054a-735a-42a0-8507-d395e85b412f	Auto Test Show	13	Manager	\N
30	21170168-f9d5-4032-820c-6063f1b02366	Auto Test Show	13	\N	\N
11	3e0cd90d-a738-4680-b7e2-443887d0cc2c	Camp Okizu	1	Acct Manager	2026-03-02 03:58:32.8
63	3e0cd90d-a738-4680-b7e2-443887d0cc2c	Emperor Spring CA Tour - Show 7	1	\N	\N
67	3e0cd90d-a738-4680-b7e2-443887d0cc2c	Emperor Spring CA Tour - Show 8	1	\N	\N
71	3e0cd90d-a738-4680-b7e2-443887d0cc2c	Emperor Spring CA Tour - Show 9	1	\N	\N
75	3e0cd90d-a738-4680-b7e2-443887d0cc2c	Emperor Spring CA Tour - Show 10	1	\N	\N
33	b9c6b203-d659-4f9c-be4c-e7da704fabe7	Berkeley,Ca	1	\N	\N
34	b9c6b203-d659-4f9c-be4c-e7da704fabe7	Los Angeles	1	\N	\N
35	b9c6b203-d659-4f9c-be4c-e7da704fabe7	San Francisco	1	\N	\N
39	3e0cd90d-a738-4680-b7e2-443887d0cc2c	Emperor Spring CA Tour - Show 1	1	\N	\N
43	3e0cd90d-a738-4680-b7e2-443887d0cc2c	Emperor Spring CA Tour - Show 2	1	\N	\N
\.


--
-- Data for Name: event_day_venues; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.event_day_venues (id, event_id, date, venue_id, workspace_id) FROM stdin;
36	49	2026-03-11	4	1
41	51	2026-02-04	14	1
42	51	2026-03-10	14	1
43	51	2026-03-11	14	1
44	51	2026-03-12	14	1
45	51	2026-03-13	14	1
46	51	2026-03-14	14	1
47	51	2026-03-15	14	1
39	51	2026-02-02	14	1
40	51	2026-02-03	14	1
53	49	2026-03-13	15	1
37	49	2026-03-12	4	1
51	54	2026-02-13	7	1
56	55	2026-02-14	14	1
57	56	2026-02-15	17	1
59	63	2026-02-14	15	1
60	64	2026-02-14	18	1
62	64	2026-02-15	18	1
63	64	2026-02-16	18	1
61	63	2026-02-16	15	1
48	51	2026-02-01	14	1
35	49	2026-03-10	4	1
73	80	2026-03-10	14	1
74	81	2026-03-10	19	1
76	80	2026-03-13	14	1
75	81	2026-03-11	19	1
72	79	2026-03-09	16	1
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.events (id, name, color, notes, start_date, end_date, venue_id, workspace_id, project_id) FROM stdin;
54	First Show - FEB 13	\N	\N	2026-02-13	2026-02-13	7	1	1
81	Los Angeles	\N	\N	2026-03-11	2026-03-11	19	1	14
55	Second Show - FEB 14	\N	\N	2026-02-14	2026-02-14	14	1	1
56	Third Show - FEB 15	\N	\N	2026-02-15	2026-02-15	17	1	1
82	Test Tour ABC - Show 1	\N	\N	2026-03-03	2026-03-03	\N	25	15
83	Test Tour ABC - Show 2	\N	\N	2026-03-04	2026-03-04	\N	25	15
84	Test Tour ABC - Show 3	\N	\N	2026-03-05	2026-03-05	\N	25	15
85	Test Tour ABC - Show 4	\N	\N	2026-03-06	2026-03-06	\N	25	15
86	Test Tour ABC - Show 5	\N	\N	2026-03-07	2026-03-07	\N	25	15
79	Berkeley,Ca	\N	\N	2026-03-09	2026-03-09	16	1	14
64	Microsoft at Filoli	\N	\N	2026-02-14	2026-02-16	18	1	3
63	Fourth Show- FEB 16	\N	\N	2026-02-16	2026-02-16	15	1	1
51	Apple	\N	\N	2026-02-01	2026-02-03	14	1	5
49	Camp Okizu	\N	\N	2026-03-10	2026-03-15	15	1	4
87	Emperor Spring CA Tour - Show 1	\N	\N	2026-03-13	2026-03-13	\N	1	14
96	Emperor Spring CA Tour - Show 10	\N	\N	2026-03-22	2026-03-22	\N	1	14
88	Emperor Spring CA Tour - Show 2	\N	\N	2026-03-14	2026-03-14	\N	1	14
89	Emperor Spring CA Tour - Show 3	\N	\N	2026-03-15	2026-03-15	\N	1	14
90	Emperor Spring CA Tour - Show 4	\N	\N	2026-03-16	2026-03-16	\N	1	14
91	Emperor Spring CA Tour - Show 5	\N	\N	2026-03-17	2026-03-17	\N	1	14
92	Emperor Spring CA Tour - Show 6	\N	\N	2026-03-18	2026-03-18	\N	1	14
93	Emperor Spring CA Tour - Show 7	\N	\N	2026-03-19	2026-03-19	\N	1	14
74	Auto Test Show	\N	\N	2026-03-02	2026-03-02	\N	13	\N
75	Test Show	\N	\N	2026-03-01	2026-03-01	\N	17	10
76	Gantt Show	\N	\N	2026-03-01	2026-03-01	\N	18	11
77	Test Show	\N	\N	2026-03-01	2026-03-01	\N	19	12
78	My Show	\N	\N	2026-03-01	2026-03-01	\N	20	13
94	Emperor Spring CA Tour - Show 8	\N	\N	2026-03-20	2026-03-20	\N	1	14
95	Emperor Spring CA Tour - Show 9	\N	\N	2026-03-21	2026-03-21	\N	1	14
80	San Francisco	\N	\N	2026-03-13	2026-03-13	14	1	14
\.


--
-- Data for Name: file_folders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.file_folders (id, name, event_name, workspace_id, parent_id) FROM stdin;
1	Console Files	\N	1	\N
2	Site Maps	\N	1	\N
3	Trucking info	\N	1	\N
4	Audio	Camp Okizu	1	\N
5	from Client	Camp Okizu	1	\N
6	Drawings	Camp Okizu	1	\N
7	Trucking	Camp Okizu	1	\N
\.


--
-- Data for Name: files; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.files (id, name, url, type, size, uploaded_at, event_name, workspace_id, folder_name) FROM stdin;
3	Camp Okizu 2026-GP-021326.pdf	/uploads/1771611250633-214855296-Camp Okizu 2026-GP-021326.pdf	application/pdf	16866195	2026-02-20 18:14:11.695315	Camp Okizu	1	Drawings
7	Gear Request - DJ SoundImage - Mar 2, 2026, 7:01 PM	/uploads/Gear_Request_Camp_Okizu_1772478102430.pdf	application/pdf	2376	2026-03-02 19:01:42.432729	Camp Okizu	1	Gear Requests
\.


--
-- Data for Name: gear_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.gear_requests (id, event_id, workspace_id, requested_by, requested_by_name, recipient_email, items, notes, status, created_at, file_id) FROM stdin;
1	49	1	3e0cd90d-a738-4680-b7e2-443887d0cc2c	DJ SoundImage	dj.soundimage@gmail.com	1 x sm57 \n3 x windscreens\n100x mic clips	\N	sent	2026-03-02 19:01:42.438333	\N
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, type, title, message, event_name, read, created_at, workspace_id) FROM stdin;
1	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	Schedule Updated	"Prep Control and Live Auction Pa" was updated in Camp Okizu	Camp Okizu	f	2026-02-26 14:14:52.274738	1
2	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	Schedule Updated	"Prep Control and Live Auction Pa" was updated in Camp Okizu	Camp Okizu	f	2026-02-26 14:15:16.748842	1
3	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	Schedule Updated	"Prep Control and Live Auction Pa" was updated in Camp Okizu	Camp Okizu	f	2026-02-26 14:26:09.08118	1
4	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Show" was added to Camp Okizu	Camp Okizu	f	2026-02-26 14:26:27.943068	1
5	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	Schedule Item Removed	"Show" was removed from Camp Okizu	Camp Okizu	f	2026-02-26 14:38:35.881843	1
6	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Show" was added to Camp Okizu	Camp Okizu	f	2026-02-26 14:38:50.884206	1
7	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	Schedule Updated	"Show" was updated in Camp Okizu	Camp Okizu	f	2026-02-26 14:39:03.732238	1
8	154921bc-c1b2-42ee-8a07-4722ef256140	comment	New Comment	DJ SoundImage commented on "Show" in Camp Okizu	Camp Okizu	f	2026-02-26 14:39:49.029898	1
9	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	Schedule Item Removed	"Show" was removed from Camp Okizu	Camp Okizu	f	2026-02-26 14:57:07.022406	1
10	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Load in" was added to Camp Okizu	Camp Okizu	f	2026-02-26 14:58:30.546975	1
11	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	Schedule Updated	"Load in" was updated in Camp Okizu	Camp Okizu	f	2026-02-26 14:58:48.415229	1
12	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	Schedule Item Removed	"Load in" was removed from Camp Okizu	Camp Okizu	f	2026-02-26 14:58:58.93982	1
13	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	assignment_change	Show Assignment	You were assigned to "Camp Okizu"	Camp Okizu	f	2026-02-28 19:04:41.59291	1
14	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	Schedule Updated	"Load In" was updated in Camp Okizu	Camp Okizu	f	2026-02-28 20:06:06.085107	1
15	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	Schedule Updated	"Load In" was updated in Camp Okizu	Camp Okizu	f	2026-02-28 20:06:06.090926	1
16	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	Schedule Updated	"Load In" was updated in Camp Okizu	Camp Okizu	f	2026-02-28 20:06:45.441536	1
17	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	Schedule Updated	"Load In" was updated in Camp Okizu	Camp Okizu	f	2026-02-28 20:06:45.4547	1
18	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	Schedule Updated	"Lunch" was updated in Camp Okizu	Camp Okizu	f	2026-03-01 16:21:06.605151	1
19	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	Schedule Updated	"Lunch" was updated in Camp Okizu	Camp Okizu	f	2026-03-01 16:21:06.609745	1
20	154921bc-c1b2-42ee-8a07-4722ef256140	assignment_change	Show Assignment	You were assigned to "Stage 1"	Stage 1	f	2026-03-01 16:42:54.259329	1
21	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	assignment_change	Show Assignment	You were assigned to "Stage 1"	Stage 1	f	2026-03-01 16:43:05.747596	1
22	fb7e64ae-5e69-4176-baa5-767c7fb7662d	assignment_change	Show Assignment	You were assigned to "Stage 1"	Stage 1	f	2026-03-01 16:43:09.421004	1
23	0f016996-30c8-4f4b-a182-ff2a99764220	assignment_change	Show Assignment	You were assigned to "Stage 1"	Stage 1	f	2026-03-01 16:45:54.483118	1
24	0f016996-30c8-4f4b-a182-ff2a99764220	assignment_change	Show Assignment	You were assigned to "Stage 1"	Stage 1	f	2026-03-01 16:46:02.909282	1
25	154921bc-c1b2-42ee-8a07-4722ef256140	assignment_change	Show Assignment	You were assigned to "Stage 1"	Stage 1	f	2026-03-01 16:47:24.070248	1
26	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	assignment_change	Show Assignment	You were assigned to "Stage 1"	Stage 1	f	2026-03-01 16:47:27.959489	1
27	fb7e64ae-5e69-4176-baa5-767c7fb7662d	assignment_change	Show Assignment	You were assigned to "Stage 1"	Stage 1	f	2026-03-01 16:47:29.241796	1
28	154921bc-c1b2-42ee-8a07-4722ef256140	assignment_change	Show Assignment	You were assigned to "Stage 1"	Stage 1	f	2026-03-01 16:48:31.683767	1
29	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	assignment_change	Show Assignment	You were assigned to "Stage 1"	Stage 1	f	2026-03-01 16:48:39.632477	1
30	fb7e64ae-5e69-4176-baa5-767c7fb7662d	assignment_change	Show Assignment	You were assigned to "Stage 1"	Stage 1	f	2026-03-01 16:48:49.540407	1
31	154921bc-c1b2-42ee-8a07-4722ef256140	assignment_change	Show Assignment	You were assigned to "Stage 1"	Stage 1	f	2026-03-01 17:01:10.250458	1
32	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Site Open / Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:07:27.346507	1
33	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Site Open / Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:07:27.351018	1
34	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Site Open / Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:07:27.354285	1
35	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Site Open / Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:07:27.356656	1
36	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Sound Checks - All Stages" was added to Stage 1	Stage 1	f	2026-03-01 17:07:27.673096	1
37	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Sound Checks - All Stages" was added to Stage 1	Stage 1	f	2026-03-01 17:07:27.6786	1
38	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Sound Checks - All Stages" was added to Stage 1	Stage 1	f	2026-03-01 17:07:27.682294	1
39	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Sound Checks - All Stages" was added to Stage 1	Stage 1	f	2026-03-01 17:07:27.68512	1
40	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Crew Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:07:28.020474	1
41	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Crew Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:07:28.025787	1
42	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Crew Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:07:28.029249	1
43	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Crew Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:07:28.031792	1
44	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Gates Open" was added to Stage 1	Stage 1	f	2026-03-01 17:07:28.444222	1
45	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Gates Open" was added to Stage 1	Stage 1	f	2026-03-01 17:07:28.450351	1
46	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Gates Open" was added to Stage 1	Stage 1	f	2026-03-01 17:07:28.45354	1
47	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Gates Open" was added to Stage 1	Stage 1	f	2026-03-01 17:07:28.457046	1
48	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Main Stage - Act 1" was added to Stage 1	Stage 1	f	2026-03-01 17:07:28.873492	1
49	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Main Stage - Act 1" was added to Stage 1	Stage 1	f	2026-03-01 17:07:28.877633	1
50	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Main Stage - Act 1" was added to Stage 1	Stage 1	f	2026-03-01 17:07:28.884305	1
51	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Main Stage - Act 1" was added to Stage 1	Stage 1	f	2026-03-01 17:07:28.887363	1
52	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Main Stage - Act 2" was added to Stage 1	Stage 1	f	2026-03-01 17:07:29.308516	1
53	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Main Stage - Act 2" was added to Stage 1	Stage 1	f	2026-03-01 17:07:29.314878	1
54	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Main Stage - Act 2" was added to Stage 1	Stage 1	f	2026-03-01 17:07:29.318408	1
55	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Main Stage - Act 2" was added to Stage 1	Stage 1	f	2026-03-01 17:07:29.321712	1
56	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Crew Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:07:29.742131	1
57	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Crew Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:07:29.74761	1
58	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Crew Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:07:29.751237	1
59	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Crew Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:07:29.754504	1
60	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Headliner" was added to Stage 1	Stage 1	f	2026-03-01 17:07:30.009909	1
61	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Headliner" was added to Stage 1	Stage 1	f	2026-03-01 17:07:30.015014	1
62	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Headliner" was added to Stage 1	Stage 1	f	2026-03-01 17:07:30.01754	1
63	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Headliner" was added to Stage 1	Stage 1	f	2026-03-01 17:07:30.020364	1
64	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:07:46.651141	1
65	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:07:46.656399	1
66	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:07:46.659962	1
67	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:07:46.668649	1
68	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Stage Setup" was added to Stage 1	Stage 1	f	2026-03-01 17:07:46.928492	1
69	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Stage Setup" was added to Stage 1	Stage 1	f	2026-03-01 17:07:46.933607	1
70	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Stage Setup" was added to Stage 1	Stage 1	f	2026-03-01 17:07:46.936891	1
71	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Stage Setup" was added to Stage 1	Stage 1	f	2026-03-01 17:07:46.941967	1
72	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:07:47.121058	1
73	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:07:47.136756	1
74	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:07:47.140539	1
75	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:07:47.145167	1
76	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Sound Check" was added to Stage 1	Stage 1	f	2026-03-01 17:07:47.316266	1
77	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Sound Check" was added to Stage 1	Stage 1	f	2026-03-01 17:07:47.321498	1
78	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Sound Check" was added to Stage 1	Stage 1	f	2026-03-01 17:07:47.324352	1
79	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Sound Check" was added to Stage 1	Stage 1	f	2026-03-01 17:07:47.327186	1
80	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:07:47.528961	1
81	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:07:47.531995	1
82	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:07:47.535013	1
83	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:07:47.537677	1
84	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Doors Open" was added to Stage 1	Stage 1	f	2026-03-01 17:07:47.780674	1
85	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Doors Open" was added to Stage 1	Stage 1	f	2026-03-01 17:07:47.785149	1
86	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Doors Open" was added to Stage 1	Stage 1	f	2026-03-01 17:07:47.787854	1
87	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Doors Open" was added to Stage 1	Stage 1	f	2026-03-01 17:07:47.791055	1
88	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Show" was added to Stage 1	Stage 1	f	2026-03-01 17:07:48.000674	1
89	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Show" was added to Stage 1	Stage 1	f	2026-03-01 17:07:48.005587	1
90	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Show" was added to Stage 1	Stage 1	f	2026-03-01 17:07:48.008431	1
91	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Show" was added to Stage 1	Stage 1	f	2026-03-01 17:07:48.011314	1
92	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	Schedule Item Removed	"Show" was removed from Stage 1	Stage 1	f	2026-03-01 17:07:53.743156	1
93	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	Schedule Item Removed	"Show" was removed from Stage 1	Stage 1	f	2026-03-01 17:07:53.7492	1
94	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	Schedule Item Removed	"Show" was removed from Stage 1	Stage 1	f	2026-03-01 17:07:53.752171	1
95	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	Schedule Item Removed	"Show" was removed from Stage 1	Stage 1	f	2026-03-01 17:07:53.754996	1
96	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	Schedule Item Removed	"Doors Open" was removed from Stage 1	Stage 1	f	2026-03-01 17:07:56.05764	1
97	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	Schedule Item Removed	"Doors Open" was removed from Stage 1	Stage 1	f	2026-03-01 17:07:56.061953	1
98	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	Schedule Item Removed	"Doors Open" was removed from Stage 1	Stage 1	f	2026-03-01 17:07:56.064579	1
99	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	Schedule Item Removed	"Doors Open" was removed from Stage 1	Stage 1	f	2026-03-01 17:07:56.067036	1
100	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:10.053598	1
101	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:10.058779	1
102	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:10.061863	1
103	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:10.064878	1
104	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:08:10.316551	1
105	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:08:10.32129	1
106	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:08:10.32436	1
107	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:08:10.327335	1
108	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Stage Setup" was added to Stage 1	Stage 1	f	2026-03-01 17:08:10.547771	1
109	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Stage Setup" was added to Stage 1	Stage 1	f	2026-03-01 17:08:10.552303	1
110	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Stage Setup" was added to Stage 1	Stage 1	f	2026-03-01 17:08:10.555037	1
111	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Stage Setup" was added to Stage 1	Stage 1	f	2026-03-01 17:08:10.558405	1
112	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:08:10.765437	1
113	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:08:10.770464	1
114	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:08:10.77285	1
115	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:08:10.775689	1
116	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Sound Check" was added to Stage 1	Stage 1	f	2026-03-01 17:08:10.98902	1
117	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Sound Check" was added to Stage 1	Stage 1	f	2026-03-01 17:08:11.01857	1
118	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Sound Check" was added to Stage 1	Stage 1	f	2026-03-01 17:08:11.021529	1
119	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Sound Check" was added to Stage 1	Stage 1	f	2026-03-01 17:08:11.024659	1
120	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:24.476096	1
121	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:24.481159	1
122	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:24.485559	1
123	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:24.488516	1
124	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:08:24.73875	1
125	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:08:24.743876	1
126	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:08:24.747275	1
127	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:08:24.749944	1
128	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Stage Setup" was added to Stage 1	Stage 1	f	2026-03-01 17:08:24.962601	1
129	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Stage Setup" was added to Stage 1	Stage 1	f	2026-03-01 17:08:24.967604	1
130	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Stage Setup" was added to Stage 1	Stage 1	f	2026-03-01 17:08:24.970562	1
131	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Stage Setup" was added to Stage 1	Stage 1	f	2026-03-01 17:08:24.973425	1
132	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:08:25.187047	1
133	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:08:25.19163	1
134	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:08:25.202619	1
135	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:08:25.205214	1
136	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Sound Check" was added to Stage 1	Stage 1	f	2026-03-01 17:08:25.479749	1
137	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Sound Check" was added to Stage 1	Stage 1	f	2026-03-01 17:08:25.484892	1
138	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Sound Check" was added to Stage 1	Stage 1	f	2026-03-01 17:08:25.487811	1
139	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Sound Check" was added to Stage 1	Stage 1	f	2026-03-01 17:08:25.490764	1
140	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Site Open / Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:08:44.2375	1
141	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Site Open / Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:08:44.244131	1
142	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Site Open / Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:08:44.247042	1
143	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Site Open / Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:08:44.249337	1
144	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Sound Checks - All Stages" was added to Stage 1	Stage 1	f	2026-03-01 17:08:44.584327	1
145	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Sound Checks - All Stages" was added to Stage 1	Stage 1	f	2026-03-01 17:08:44.588609	1
146	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Sound Checks - All Stages" was added to Stage 1	Stage 1	f	2026-03-01 17:08:44.591989	1
147	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Sound Checks - All Stages" was added to Stage 1	Stage 1	f	2026-03-01 17:08:44.596752	1
148	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Crew Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:08:44.770079	1
149	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Crew Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:08:44.775415	1
150	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Crew Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:08:44.778557	1
151	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Crew Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:08:44.781697	1
152	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Gates Open" was added to Stage 1	Stage 1	f	2026-03-01 17:08:44.95668	1
153	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Gates Open" was added to Stage 1	Stage 1	f	2026-03-01 17:08:44.962441	1
154	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Gates Open" was added to Stage 1	Stage 1	f	2026-03-01 17:08:44.965573	1
155	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Gates Open" was added to Stage 1	Stage 1	f	2026-03-01 17:08:44.96852	1
156	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Main Stage - Act 1" was added to Stage 1	Stage 1	f	2026-03-01 17:08:45.1774	1
157	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Main Stage - Act 1" was added to Stage 1	Stage 1	f	2026-03-01 17:08:45.181725	1
158	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Main Stage - Act 1" was added to Stage 1	Stage 1	f	2026-03-01 17:08:45.35515	1
159	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Main Stage - Act 1" was added to Stage 1	Stage 1	f	2026-03-01 17:08:45.359245	1
160	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Main Stage - Act 2" was added to Stage 1	Stage 1	f	2026-03-01 17:08:45.49043	1
161	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Main Stage - Act 2" was added to Stage 1	Stage 1	f	2026-03-01 17:08:45.494561	1
162	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Main Stage - Act 2" was added to Stage 1	Stage 1	f	2026-03-01 17:08:45.497515	1
163	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Main Stage - Act 2" was added to Stage 1	Stage 1	f	2026-03-01 17:08:45.500231	1
164	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Crew Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:45.758921	1
165	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Crew Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:45.763236	1
166	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Crew Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:45.765785	1
167	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Crew Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:45.768546	1
168	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Headliner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:45.987751	1
169	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Headliner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:45.992126	1
170	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Headliner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:45.994775	1
171	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Headliner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:45.997275	1
172	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Site Open / Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:08:50.806484	1
173	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Site Open / Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:08:50.811018	1
174	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Site Open / Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:08:50.813523	1
175	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Site Open / Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:08:50.815941	1
176	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Sound Checks - All Stages" was added to Stage 1	Stage 1	f	2026-03-01 17:08:51.066848	1
177	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Sound Checks - All Stages" was added to Stage 1	Stage 1	f	2026-03-01 17:08:51.070683	1
178	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Sound Checks - All Stages" was added to Stage 1	Stage 1	f	2026-03-01 17:08:51.073508	1
179	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Sound Checks - All Stages" was added to Stage 1	Stage 1	f	2026-03-01 17:08:51.076241	1
180	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Crew Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:08:51.250857	1
181	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Crew Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:08:51.254952	1
182	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Crew Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:08:51.257481	1
183	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Crew Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:08:51.260056	1
184	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Gates Open" was added to Stage 1	Stage 1	f	2026-03-01 17:08:51.457329	1
185	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Gates Open" was added to Stage 1	Stage 1	f	2026-03-01 17:08:51.462141	1
186	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Gates Open" was added to Stage 1	Stage 1	f	2026-03-01 17:08:51.465126	1
187	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Gates Open" was added to Stage 1	Stage 1	f	2026-03-01 17:08:51.467956	1
188	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Main Stage - Act 1" was added to Stage 1	Stage 1	f	2026-03-01 17:08:51.67103	1
189	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Main Stage - Act 1" was added to Stage 1	Stage 1	f	2026-03-01 17:08:51.674608	1
190	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Main Stage - Act 1" was added to Stage 1	Stage 1	f	2026-03-01 17:08:51.6773	1
191	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Main Stage - Act 1" was added to Stage 1	Stage 1	f	2026-03-01 17:08:51.679928	1
192	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Main Stage - Act 2" was added to Stage 1	Stage 1	f	2026-03-01 17:08:51.926863	1
193	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Main Stage - Act 2" was added to Stage 1	Stage 1	f	2026-03-01 17:08:51.930849	1
194	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Main Stage - Act 2" was added to Stage 1	Stage 1	f	2026-03-01 17:08:51.933492	1
195	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Main Stage - Act 2" was added to Stage 1	Stage 1	f	2026-03-01 17:08:51.935988	1
196	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Crew Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:52.158945	1
197	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Crew Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:52.163996	1
198	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Crew Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:52.166469	1
199	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Crew Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:52.169282	1
204	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Site Open / Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:08:56.490958	1
205	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Site Open / Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:08:56.495811	1
206	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Site Open / Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:08:56.498334	1
207	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Site Open / Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:08:56.501203	1
208	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Sound Checks - All Stages" was added to Stage 1	Stage 1	f	2026-03-01 17:08:56.748666	1
209	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Sound Checks - All Stages" was added to Stage 1	Stage 1	f	2026-03-01 17:08:56.753692	1
210	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Sound Checks - All Stages" was added to Stage 1	Stage 1	f	2026-03-01 17:08:56.7562	1
211	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Sound Checks - All Stages" was added to Stage 1	Stage 1	f	2026-03-01 17:08:56.759334	1
216	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Gates Open" was added to Stage 1	Stage 1	f	2026-03-01 17:08:57.117424	1
217	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Gates Open" was added to Stage 1	Stage 1	f	2026-03-01 17:08:57.121811	1
218	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Gates Open" was added to Stage 1	Stage 1	f	2026-03-01 17:08:57.124573	1
219	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Gates Open" was added to Stage 1	Stage 1	f	2026-03-01 17:08:57.126809	1
220	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Main Stage - Act 1" was added to Stage 1	Stage 1	f	2026-03-01 17:08:57.33269	1
221	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Main Stage - Act 1" was added to Stage 1	Stage 1	f	2026-03-01 17:08:57.337646	1
222	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Main Stage - Act 1" was added to Stage 1	Stage 1	f	2026-03-01 17:08:57.339867	1
223	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Main Stage - Act 1" was added to Stage 1	Stage 1	f	2026-03-01 17:08:57.342573	1
232	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Headliner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:58.124014	1
233	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Headliner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:58.13226	1
234	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Headliner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:58.140895	1
235	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Headliner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:58.144815	1
200	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Headliner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:52.433641	1
201	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Headliner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:52.43681	1
202	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Headliner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:52.439555	1
203	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Headliner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:52.4422	1
224	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Main Stage - Act 2" was added to Stage 1	Stage 1	f	2026-03-01 17:08:57.550005	1
225	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Main Stage - Act 2" was added to Stage 1	Stage 1	f	2026-03-01 17:08:57.555167	1
226	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Main Stage - Act 2" was added to Stage 1	Stage 1	f	2026-03-01 17:08:57.558157	1
227	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Main Stage - Act 2" was added to Stage 1	Stage 1	f	2026-03-01 17:08:57.561246	1
264	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Headliner" was added to Stage 1	Stage 1	f	2026-03-01 17:09:04.709988	1
265	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Headliner" was added to Stage 1	Stage 1	f	2026-03-01 17:09:04.71444	1
266	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Headliner" was added to Stage 1	Stage 1	f	2026-03-01 17:09:04.717213	1
267	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Headliner" was added to Stage 1	Stage 1	f	2026-03-01 17:09:04.719816	1
212	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Crew Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:08:56.935424	1
213	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Crew Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:08:56.941185	1
214	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Crew Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:08:56.943604	1
215	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Crew Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:08:56.946238	1
228	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Crew Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:57.888345	1
229	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Crew Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:57.892244	1
230	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Crew Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:57.894533	1
231	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Crew Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:08:57.897556	1
236	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Site Open / Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:09:02.924162	1
237	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Site Open / Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:09:02.928778	1
238	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Site Open / Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:09:02.932014	1
239	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Site Open / Load In" was added to Stage 1	Stage 1	f	2026-03-01 17:09:02.934401	1
240	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Sound Checks - All Stages" was added to Stage 1	Stage 1	f	2026-03-01 17:09:03.440229	1
241	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Sound Checks - All Stages" was added to Stage 1	Stage 1	f	2026-03-01 17:09:03.444943	1
242	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Sound Checks - All Stages" was added to Stage 1	Stage 1	f	2026-03-01 17:09:03.447591	1
243	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Sound Checks - All Stages" was added to Stage 1	Stage 1	f	2026-03-01 17:09:03.450277	1
244	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Crew Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:09:03.630679	1
245	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Crew Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:09:03.635571	1
246	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Crew Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:09:03.638492	1
247	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Crew Lunch" was added to Stage 1	Stage 1	f	2026-03-01 17:09:03.643215	1
248	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Gates Open" was added to Stage 1	Stage 1	f	2026-03-01 17:09:03.816184	1
249	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Gates Open" was added to Stage 1	Stage 1	f	2026-03-01 17:09:03.820612	1
250	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Gates Open" was added to Stage 1	Stage 1	f	2026-03-01 17:09:03.823296	1
251	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Gates Open" was added to Stage 1	Stage 1	f	2026-03-01 17:09:03.826144	1
252	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Main Stage - Act 1" was added to Stage 1	Stage 1	f	2026-03-01 17:09:04.02044	1
253	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Main Stage - Act 1" was added to Stage 1	Stage 1	f	2026-03-01 17:09:04.025366	1
254	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Main Stage - Act 1" was added to Stage 1	Stage 1	f	2026-03-01 17:09:04.027599	1
255	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Main Stage - Act 1" was added to Stage 1	Stage 1	f	2026-03-01 17:09:04.030215	1
256	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Main Stage - Act 2" was added to Stage 1	Stage 1	f	2026-03-01 17:09:04.221046	1
257	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Main Stage - Act 2" was added to Stage 1	Stage 1	f	2026-03-01 17:09:04.225551	1
258	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Main Stage - Act 2" was added to Stage 1	Stage 1	f	2026-03-01 17:09:04.228052	1
259	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Main Stage - Act 2" was added to Stage 1	Stage 1	f	2026-03-01 17:09:04.231506	1
260	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Crew Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:09:04.439604	1
261	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Crew Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:09:04.444045	1
262	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Crew Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:09:04.44673	1
263	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Crew Dinner" was added to Stage 1	Stage 1	f	2026-03-01 17:09:04.448807	1
268	21170168-f9d5-4032-820c-6063f1b02366	assignment_change	Show Assignment	You were assigned to "Auto Test Show"	Auto Test Show	f	2026-03-01 18:01:27.735632	13
269	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Show" was added to Camp Okizu	Camp Okizu	f	2026-03-01 21:14:58.544283	1
270	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Show" was added to Camp Okizu	Camp Okizu	f	2026-03-01 21:14:58.550126	1
271	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	Schedule Updated	"DAY 1" was updated in Camp Okizu	Camp Okizu	f	2026-03-01 21:15:34.776418	1
272	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	Schedule Updated	"DAY 1" was updated in Camp Okizu	Camp Okizu	f	2026-03-01 21:15:34.782538	1
273	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	Schedule Updated	"DAY 1" was updated in Camp Okizu	Camp Okizu	f	2026-03-01 21:16:01.392803	1
274	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	Schedule Updated	"DAY 1" was updated in Camp Okizu	Camp Okizu	f	2026-03-01 21:16:01.398957	1
275	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Site Open / Load In" was added to Stage 1	Stage 1	f	2026-03-01 23:42:55.357137	1
276	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Site Open / Load In" was added to Stage 1	Stage 1	f	2026-03-01 23:42:55.362821	1
277	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Site Open / Load In" was added to Stage 1	Stage 1	f	2026-03-01 23:42:55.366361	1
278	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Site Open / Load In" was added to Stage 1	Stage 1	f	2026-03-01 23:42:55.370555	1
279	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Sound Checks - All Stages" was added to Stage 1	Stage 1	f	2026-03-01 23:42:56.17519	1
280	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Sound Checks - All Stages" was added to Stage 1	Stage 1	f	2026-03-01 23:42:56.180823	1
281	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Sound Checks - All Stages" was added to Stage 1	Stage 1	f	2026-03-01 23:42:56.184674	1
282	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Sound Checks - All Stages" was added to Stage 1	Stage 1	f	2026-03-01 23:42:56.187526	1
283	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Crew Lunch" was added to Stage 1	Stage 1	f	2026-03-01 23:42:56.946921	1
284	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Crew Lunch" was added to Stage 1	Stage 1	f	2026-03-01 23:42:56.95211	1
285	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Crew Lunch" was added to Stage 1	Stage 1	f	2026-03-01 23:42:56.955116	1
286	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Crew Lunch" was added to Stage 1	Stage 1	f	2026-03-01 23:42:56.958562	1
287	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Gates Open" was added to Stage 1	Stage 1	f	2026-03-01 23:42:57.698369	1
288	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Gates Open" was added to Stage 1	Stage 1	f	2026-03-01 23:42:57.704245	1
289	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Gates Open" was added to Stage 1	Stage 1	f	2026-03-01 23:42:57.707116	1
290	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Gates Open" was added to Stage 1	Stage 1	f	2026-03-01 23:42:57.710645	1
291	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Main Stage - Act 1" was added to Stage 1	Stage 1	f	2026-03-01 23:42:58.648398	1
292	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Main Stage - Act 1" was added to Stage 1	Stage 1	f	2026-03-01 23:42:58.654233	1
293	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Main Stage - Act 1" was added to Stage 1	Stage 1	f	2026-03-01 23:42:58.657015	1
294	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Main Stage - Act 1" was added to Stage 1	Stage 1	f	2026-03-01 23:42:58.660807	1
295	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Main Stage - Act 2" was added to Stage 1	Stage 1	f	2026-03-01 23:42:59.60565	1
296	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Main Stage - Act 2" was added to Stage 1	Stage 1	f	2026-03-01 23:42:59.610574	1
297	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Main Stage - Act 2" was added to Stage 1	Stage 1	f	2026-03-01 23:42:59.622609	1
298	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Main Stage - Act 2" was added to Stage 1	Stage 1	f	2026-03-01 23:42:59.626156	1
299	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Crew Dinner" was added to Stage 1	Stage 1	f	2026-03-01 23:43:00.711354	1
300	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Crew Dinner" was added to Stage 1	Stage 1	f	2026-03-01 23:43:00.715719	1
301	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Crew Dinner" was added to Stage 1	Stage 1	f	2026-03-01 23:43:00.718803	1
302	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Crew Dinner" was added to Stage 1	Stage 1	f	2026-03-01 23:43:00.722104	1
303	0f016996-30c8-4f4b-a182-ff2a99764220	schedule_change	New Schedule Item	"Headliner" was added to Stage 1	Stage 1	f	2026-03-01 23:43:01.762008	1
304	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Headliner" was added to Stage 1	Stage 1	f	2026-03-01 23:43:01.766514	1
305	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Headliner" was added to Stage 1	Stage 1	f	2026-03-01 23:43:01.769174	1
306	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Headliner" was added to Stage 1	Stage 1	f	2026-03-01 23:43:01.771734	1
307	0f016996-30c8-4f4b-a182-ff2a99764220	assignment_change	Show Assignment	You were assigned to "Stage 1"	Stage 1	f	2026-03-02 04:26:28.533931	1
308	0f016996-30c8-4f4b-a182-ff2a99764220	assignment_change	Show Assignment	You were assigned to "Stage 1"	Stage 1	f	2026-03-02 04:40:56.032707	1
309	154921bc-c1b2-42ee-8a07-4722ef256140	comment	New Comment	DJ SoundImage commented on "Crew Call" in Camp Okizu	Camp Okizu	f	2026-03-02 04:43:15.957869	1
310	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	comment	New Comment	DJ SoundImage commented on "Crew Call" in Camp Okizu	Camp Okizu	f	2026-03-02 04:43:15.973798	1
311	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	Schedule Item Removed	"DAY 1" was removed from Camp Okizu	Camp Okizu	f	2026-03-02 10:53:55.082203	1
312	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	Schedule Item Removed	"DAY 1" was removed from Camp Okizu	Camp Okizu	f	2026-03-02 10:53:55.117923	1
313	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	Schedule Updated	"Prep Control and Live Auction Pa" was updated in Camp Okizu	Camp Okizu	f	2026-03-02 11:06:40.164203	1
314	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	Schedule Updated	"Prep Control and Live Auction Pa" was updated in Camp Okizu	Camp Okizu	f	2026-03-02 11:06:40.17559	1
315	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	New Schedule Item	"Show" was added to Stage 1	Stage 1	f	2026-03-03 00:29:02.524561	1
316	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	New Schedule Item	"Show" was added to Stage 1	Stage 1	f	2026-03-03 00:29:02.593894	1
317	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	New Schedule Item	"Show" was added to Stage 1	Stage 1	f	2026-03-03 00:29:02.597124	1
318	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	Schedule Item Removed	"Show" was removed from Stage 1	Stage 1	f	2026-03-03 00:29:11.681332	1
319	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	Schedule Item Removed	"Show" was removed from Stage 1	Stage 1	f	2026-03-03 00:29:11.685697	1
320	fb7e64ae-5e69-4176-baa5-767c7fb7662d	schedule_change	Schedule Item Removed	"Show" was removed from Stage 1	Stage 1	f	2026-03-03 00:29:11.688922	1
321	154921bc-c1b2-42ee-8a07-4722ef256140	schedule_change	Schedule Updated	"Prep Control and Live Auction Pa" was updated in Camp Okizu	Camp Okizu	f	2026-03-03 05:19:57.556572	1
322	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	schedule_change	Schedule Updated	"Prep Control and Live Auction Pa" was updated in Camp Okizu	Camp Okizu	f	2026-03-03 05:19:57.577364	1
323	b9c6b203-d659-4f9c-be4c-e7da704fabe7	schedule_change	New Schedule Item	"Load In" was added to Berkeley,Ca	Berkeley,Ca	f	2026-03-03 16:46:20.354383	1
324	b9c6b203-d659-4f9c-be4c-e7da704fabe7	schedule_change	New Schedule Item	"Stage Setup" was added to Berkeley,Ca	Berkeley,Ca	f	2026-03-03 16:46:20.659639	1
325	b9c6b203-d659-4f9c-be4c-e7da704fabe7	schedule_change	New Schedule Item	"Lunch" was added to Berkeley,Ca	Berkeley,Ca	f	2026-03-03 16:46:21.102076	1
326	b9c6b203-d659-4f9c-be4c-e7da704fabe7	schedule_change	New Schedule Item	"Sound Check" was added to Berkeley,Ca	Berkeley,Ca	f	2026-03-03 16:46:21.593225	1
327	b9c6b203-d659-4f9c-be4c-e7da704fabe7	schedule_change	New Schedule Item	"Dinner" was added to Berkeley,Ca	Berkeley,Ca	f	2026-03-03 16:46:22.131044	1
328	b9c6b203-d659-4f9c-be4c-e7da704fabe7	schedule_change	New Schedule Item	"Doors Open" was added to Berkeley,Ca	Berkeley,Ca	f	2026-03-03 16:46:22.643206	1
329	b9c6b203-d659-4f9c-be4c-e7da704fabe7	schedule_change	New Schedule Item	"Show" was added to Berkeley,Ca	Berkeley,Ca	f	2026-03-03 16:46:23.121409	1
330	b9c6b203-d659-4f9c-be4c-e7da704fabe7	schedule_change	New Schedule Item	"Load In" was added to Berkeley,Ca	Berkeley,Ca	f	2026-03-03 16:48:15.376251	1
331	b9c6b203-d659-4f9c-be4c-e7da704fabe7	schedule_change	Schedule Item Removed	"Load In" was removed from Berkeley,Ca	Berkeley,Ca	f	2026-03-03 16:48:27.242905	1
332	b9c6b203-d659-4f9c-be4c-e7da704fabe7	schedule_change	New Schedule Item	"Load In" was added to Los Angeles	Los Angeles	f	2026-03-03 17:24:47.589089	1
333	b9c6b203-d659-4f9c-be4c-e7da704fabe7	schedule_change	New Schedule Item	"Stage Setup" was added to Los Angeles	Los Angeles	f	2026-03-03 17:24:47.928453	1
334	b9c6b203-d659-4f9c-be4c-e7da704fabe7	schedule_change	New Schedule Item	"Lunch" was added to Los Angeles	Los Angeles	f	2026-03-03 17:24:48.111899	1
335	b9c6b203-d659-4f9c-be4c-e7da704fabe7	schedule_change	New Schedule Item	"Sound Check" was added to Los Angeles	Los Angeles	f	2026-03-03 17:24:48.376116	1
336	b9c6b203-d659-4f9c-be4c-e7da704fabe7	schedule_change	New Schedule Item	"Dinner" was added to Los Angeles	Los Angeles	f	2026-03-03 17:24:48.671087	1
337	b9c6b203-d659-4f9c-be4c-e7da704fabe7	schedule_change	New Schedule Item	"Doors Open" was added to Los Angeles	Los Angeles	f	2026-03-03 17:24:49.051451	1
338	b9c6b203-d659-4f9c-be4c-e7da704fabe7	schedule_change	New Schedule Item	"Show" was added to Los Angeles	Los Angeles	f	2026-03-03 17:24:49.324704	1
339	b9c6b203-d659-4f9c-be4c-e7da704fabe7	schedule_change	New Schedule Item	"Load In" was added to San Francisco	San Francisco	f	2026-03-03 17:24:55.484003	1
340	b9c6b203-d659-4f9c-be4c-e7da704fabe7	schedule_change	New Schedule Item	"Stage Setup" was added to San Francisco	San Francisco	f	2026-03-03 17:24:55.744283	1
341	b9c6b203-d659-4f9c-be4c-e7da704fabe7	schedule_change	New Schedule Item	"Lunch" was added to San Francisco	San Francisco	f	2026-03-03 17:24:55.950258	1
342	b9c6b203-d659-4f9c-be4c-e7da704fabe7	schedule_change	New Schedule Item	"Sound Check" was added to San Francisco	San Francisco	f	2026-03-03 17:24:56.265311	1
343	b9c6b203-d659-4f9c-be4c-e7da704fabe7	schedule_change	New Schedule Item	"Dinner" was added to San Francisco	San Francisco	f	2026-03-03 17:24:56.508585	1
344	b9c6b203-d659-4f9c-be4c-e7da704fabe7	schedule_change	New Schedule Item	"Doors Open" was added to San Francisco	San Francisco	f	2026-03-03 17:24:56.844489	1
345	b9c6b203-d659-4f9c-be4c-e7da704fabe7	schedule_change	New Schedule Item	"Show" was added to San Francisco	San Francisco	f	2026-03-03 17:24:57.097598	1
\.


--
-- Data for Name: project_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.project_assignments (id, user_id, project_id, workspace_id, "position", checked_in_at) FROM stdin;
3	3e0cd90d-a738-4680-b7e2-443887d0cc2c	9	1	\N	\N
4	fb7e64ae-5e69-4176-baa5-767c7fb7662d	9	1	\N	\N
5	154921bc-c1b2-42ee-8a07-4722ef256140	9	1	\N	\N
6	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	9	1	\N	\N
7	254dfe2c-f3b1-4d92-8182-7469a3fe9f0a	14	1	\N	\N
8	fb7e64ae-5e69-4176-baa5-767c7fb7662d	14	1	\N	\N
9	154921bc-c1b2-42ee-8a07-4722ef256140	14	1	\N	\N
10	3e0cd90d-a738-4680-b7e2-443887d0cc2c	14	1	\N	\N
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.projects (id, name, description, start_date, end_date, workspace_id, archived, drive_url, manager_id, project_number, is_festival, is_tour) FROM stdin;
1	Emperor Tour	US/Canada	2026-02-13	2026-03-13	1	t	\N	3e0cd90d-a738-4680-b7e2-443887d0cc2c	\N	f	f
3	Microsoft	Filoli activations across the campus.	2026-02-14	2026-02-16	1	t	\N	3e0cd90d-a738-4680-b7e2-443887d0cc2c	\N	f	f
5	Apple	\N	\N	\N	1	t	\N	3e0cd90d-a738-4680-b7e2-443887d0cc2c	\N	f	f
4	Camp Okizu	Camp Okizu Fundraiser Gala	2026-03-10	2026-03-15	1	f	https://drive.google.com/drive/folders/1utvRwFiIf8gXwW4UHonKHT-fBsj2bQWy?usp=drive_link	3e0cd90d-a738-4680-b7e2-443887d0cc2c	185254-0314	f	f
6	Mobile Layout Test Project	\N	\N	\N	12	f	\N	a7b98857-1865-468a-a36e-3cc5e98bf995	PRJ-TEST-001	f	f
10	Test Project	\N	\N	\N	17	f	\N	8e2a0d5c-8781-4efd-9713-8aeb6ef1e00f	\N	f	f
11	Gantt Test Project	\N	\N	\N	18	f	\N	dad5d4d8-5808-4dbe-b304-af6e142895fb	\N	f	f
12	Test Project	\N	\N	\N	19	f	\N	66bc3b91-84a7-4e45-a7dd-75443c491e06	\N	f	f
13	My Project	\N	2026-03-01	2026-03-01	20	f	\N	375b35f9-dad3-4622-95cd-28b214cf12b0	\N	f	f
14	Emperor Spring CA Tour	Canada Leg Spring	2026-03-09	2026-04-27	1	f	\N	3e0cd90d-a738-4680-b7e2-443887d0cc2c	\N	f	t
15	Test Tour ABC	\N	\N	\N	25	f	\N	a2dd2849-6a4d-4ae3-8a0f-1ee6e86990cc	\N	f	t
\.


--
-- Data for Name: schedule_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.schedule_templates (id, name, description, items, workspace_id, type) FROM stdin;
\.


--
-- Data for Name: schedules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.schedules (id, title, description, start_time, end_time, category, location, event_date, sort_order, event_name, crew_names, workspace_id, zone_id, section_id, completed, completed_at, completed_by) FROM stdin;
504	Prep Control and Live Auction Pa	Prep live auction control package and pa. 	2026-03-10 16:00:00	2026-03-10 01:00:00	Prep	Bay 1	2026-03-10	0	Camp Okizu	{"Drew Johnson","Alexander Ma"}	1	\N	3	f	\N	\N
779	Sound Check		2026-03-13 21:00:00	2026-03-13 23:00:00	Sound Check		2026-03-13	0	San Francisco	{}	1	\N	\N	f	\N	\N
780	Dinner		2026-03-13 00:00:00	2026-03-13 01:00:00	Meal		2026-03-13	0	San Francisco	{}	1	\N	\N	f	\N	\N
476	Load In		2026-02-14 16:00:00	2026-02-14 18:00:00	Load In		2026-02-14	0	Second Show - FEB 14	{}	1	\N	\N	f	\N	\N
477	Stage Setup		2026-02-14 18:00:00	2026-02-14 20:00:00	Load In		2026-02-14	0	Second Show - FEB 14	{}	1	\N	\N	f	\N	\N
478	Lunch		2026-02-14 20:00:00	2026-02-14 21:00:00	Meal		2026-02-14	0	Second Show - FEB 14	{}	1	\N	\N	f	\N	\N
479	Sound Check		2026-02-14 22:00:00	2026-02-15 00:00:00	Sound Check		2026-02-14	0	Second Show - FEB 14	{}	1	\N	\N	f	\N	\N
480	Dinner		2026-02-15 01:00:00	2026-02-15 02:00:00	Meal		2026-02-14	0	Second Show - FEB 14	{}	1	\N	\N	f	\N	\N
481	Doors Open		2026-02-15 03:00:00	2026-02-15 03:30:00	Doors Open		2026-02-14	0	Second Show - FEB 14	{}	1	\N	\N	f	\N	\N
482	Show		2026-02-15 04:00:00	2026-02-15 06:00:00	Show		2026-02-14	0	Second Show - FEB 14	{}	1	\N	\N	f	\N	\N
781	Doors Open		2026-03-13 02:00:00	2026-03-13 02:30:00	Doors Open		2026-03-13	0	San Francisco	{}	1	\N	\N	f	\N	\N
574	Sound Check		2026-02-13 22:00:00	2026-02-14 00:00:00	Sound Check		2026-02-13	0	First Show - FEB 13	{}	1	\N	\N	f	\N	\N
449	Lunch		2026-03-13 20:00:00	2026-03-13 21:00:00	Meal	Walk Away	2026-03-13	0	Camp Okizu	{"Drew Johnson","Alexander Ma"}	1	\N	\N	f	\N	\N
466	Tech Rehearsal		2026-03-14 22:00:00	2026-03-14 23:30:00	Tech Rehearsal	Main Stage	2026-03-14	0	Camp Okizu	{"Alexander Ma"}	1	\N	\N	f	\N	\N
626	Lunch		2026-03-12 20:00:00	2026-03-12 21:00:00	Meal		2026-03-12	0	Camp Okizu	{"Alexander Ma","Drew Johnson"}	1	\N	\N	f	\N	\N
467	Silent Auction Live		2026-03-14 00:00:00	\N	Show	Silent Auction	2026-03-14	0	Camp Okizu	{"Alexander Ma"}	1	\N	\N	f	\N	\N
602	Venue Setup		2026-02-15 15:00:00	2026-02-15 16:30:00	Load In		2026-02-15	0	Microsoft at Filoli	{}	1	\N	\N	f	\N	\N
468	Doors Open		2026-03-14 00:30:00	\N	Doors Open	Festival Pavillion	2026-03-14	0	Camp Okizu	{"Alexander Ma","Drew Johnson"}	1	\N	\N	f	\N	\N
584	Silent Auction Load In		2026-03-13 21:30:00	\N	Load In	Silent Auction 	2026-03-13	0	Camp Okizu	{"Drew Johnson","Alexander Ma"}	1	\N	4	f	\N	\N
507	Load Out		2026-03-15 17:00:00	2026-03-15 02:00:00	Load Out	Festival Pavillion	2026-03-15	0	Camp Okizu	{"Drew Johnson","Alexander Ma"}	1	\N	\N	f	\N	\N
603	AV Check		2026-02-15 16:30:00	2026-02-15 17:00:00	Sound Check		2026-02-15	0	Microsoft at Filoli	{}	1	\N	\N	f	\N	\N
604	Registration & Coffee		2026-02-15 17:00:00	2026-02-15 17:30:00	Coffee Break		2026-02-15	0	Microsoft at Filoli	{}	1	\N	\N	f	\N	\N
589	Dinner		2026-02-14 01:00:00	2026-02-14 02:00:00	Meal		2026-02-14	0	Fourth Show- FEB 16	{}	1	\N	\N	f	\N	\N
590	Doors Open		2026-02-14 03:00:00	2026-02-14 03:30:00	Doors Open		2026-02-14	0	Fourth Show- FEB 16	{}	1	\N	\N	f	\N	\N
608	Networking Reception		2026-02-15 00:30:00	2026-02-15 02:00:00	VIP Reception		2026-02-15	0	Microsoft at Filoli	{}	1	\N	\N	f	\N	\N
609	Site Open / Load In		2026-02-16 14:00:00	2026-02-16 16:00:00	Load In		2026-02-16	0	Microsoft at Filoli	{}	1	\N	\N	f	\N	\N
610	Sound Checks - All Stages		2026-02-16 16:00:00	2026-02-16 19:00:00	Sound Check		2026-02-16	0	Microsoft at Filoli	{}	1	\N	\N	f	\N	\N
611	Crew Lunch		2026-02-16 19:00:00	2026-02-16 20:00:00	Meal		2026-02-16	0	Microsoft at Filoli	{}	1	\N	\N	f	\N	\N
612	Gates Open		2026-02-16 20:00:00	2026-02-16 20:30:00	Doors Open		2026-02-16	0	Microsoft at Filoli	{}	1	\N	\N	f	\N	\N
599	Dinner		2026-02-14 01:00:00	2026-02-14 02:00:00	Meal		2026-02-14	0	Microsoft at Filoli	{}	1	\N	\N	f	\N	\N
600	Doors Open		2026-02-14 03:00:00	2026-02-14 03:30:00	Doors Open		2026-02-14	0	Microsoft at Filoli	{}	1	\N	\N	f	\N	\N
615	Crew Dinner		2026-02-16 01:00:00	2026-02-16 02:00:00	Meal		2026-02-16	0	Microsoft at Filoli	{}	1	\N	\N	f	\N	\N
616	Headliner		2026-02-16 04:00:00	2026-02-16 06:00:00	Show		2026-02-16	0	Microsoft at Filoli	{}	1	\N	\N	f	\N	\N
595	Microsoft Load In	All zones load in see below for schedule. 	2026-02-14 16:00:00	2026-02-14 18:00:00	Load In		2026-02-14	0	Microsoft at Filoli	{}	1	\N	\N	f	\N	\N
620	Sound Check		2026-02-16 22:00:00	2026-02-16 00:00:00	Sound Check		2026-02-16	0	Fourth Show- FEB 16	{}	1	\N	\N	f	\N	\N
592	Load In	Load in the Ballroom. DONT SCRATCH THE FLOOR. 	2026-02-14 16:00:00	\N	Load In		2026-02-14	0	Microsoft at Filoli	{"Jalen Russell"}	1	6	\N	f	\N	\N
593	Load In	Sunken Garden is VERY sensitive. Watch the plants. 	2026-02-14 18:00:00	\N	Load In		2026-02-14	0	Microsoft at Filoli	{"John  Jacob"}	1	4	\N	f	\N	\N
597	Lunch	All department lunch break. 	2026-02-14 20:00:00	2026-02-14 21:00:00	Meal		2026-02-14	0	Microsoft at Filoli	{"Drew Johnson","Jalen Russell","John  Jacob"}	1	\N	\N	f	\N	\N
622	Doors Open		2026-02-16 03:00:00	2026-02-16 03:30:00	Doors Open		2026-02-16	0	Fourth Show- FEB 16	{}	1	\N	\N	f	\N	\N
450	EOD		2026-03-13 01:00:00	\N	EOD	Festival Pavillion	2026-03-13	0	Camp Okizu	{"Drew Johnson","Alexander Ma"}	1	\N	\N	f	\N	\N
578	Prep Silent Auction. 		2026-03-11 16:00:00	2026-03-11 01:00:00	Load In	Bay 2	2026-03-11	0	Camp Okizu	{"Drew Johnson","Alexander Ma"}	1	\N	4	f	\N	\N
506	All System check 	System fully operational. 	2026-03-12 16:00:00	2026-03-12 01:00:00	Prep	Bays 1,2	2026-03-12	0	Camp Okizu	{"Drew Johnson","Alexander Ma"}	1	\N	\N	f	\N	\N
465	Crew Call		2026-03-14 19:30:00	\N	Crew Call	Festival Pavillion	2026-03-14	0	Camp Okizu	{"Alexander Ma"}	1	\N	\N	f	\N	\N
624	Lunch		2026-03-10 20:00:00	2026-03-10 21:00:00	Meal		2026-03-10	0	Camp Okizu	{"Alexander Ma","Drew Johnson"}	1	\N	\N	f	\N	\N
572	Stage Setup		2026-02-13 18:00:00	2026-02-13 20:00:00	Load In		2026-02-13	0	First Show - FEB 13	{}	1	\N	\N	f	\N	\N
573	Lunch		2026-02-13 20:00:00	2026-02-13 21:00:00	Meal		2026-02-13	0	First Show - FEB 13	{}	1	\N	\N	f	\N	\N
575	Dinner		2026-02-14 01:00:00	2026-02-14 02:00:00	Meal		2026-02-13	0	First Show - FEB 13	{}	1	\N	\N	f	\N	\N
536	Load In		2026-02-15 16:00:00	2026-02-15 18:00:00	Load In		2026-02-15	0	Third Show - FEB 15	{}	1	\N	\N	f	\N	\N
537	Stage Setup		2026-02-15 18:00:00	2026-02-15 20:00:00	Load In		2026-02-15	0	Third Show - FEB 15	{}	1	\N	\N	f	\N	\N
538	Lunch		2026-02-15 20:00:00	2026-02-15 21:00:00	Meal		2026-02-15	0	Third Show - FEB 15	{}	1	\N	\N	f	\N	\N
539	Sound Check		2026-02-15 22:00:00	2026-02-16 00:00:00	Sound Check		2026-02-15	0	Third Show - FEB 15	{}	1	\N	\N	f	\N	\N
540	Dinner		2026-02-16 01:00:00	2026-02-16 02:00:00	Meal		2026-02-15	0	Third Show - FEB 15	{}	1	\N	\N	f	\N	\N
541	Doors Open		2026-02-16 03:00:00	2026-02-16 03:30:00	Doors Open		2026-02-15	0	Third Show - FEB 15	{}	1	\N	\N	f	\N	\N
542	Show		2026-02-16 04:00:00	2026-02-16 06:00:00	Show		2026-02-15	0	Third Show - FEB 15	{}	1	\N	\N	f	\N	\N
576	Doors Open		2026-02-14 03:00:00	2026-02-14 03:30:00	Doors Open		2026-02-13	0	First Show - FEB 13	{}	1	\N	\N	f	\N	\N
577	Show		2026-02-14 04:00:00	2026-02-14 06:00:00	Show		2026-02-13	0	First Show - FEB 13	{}	1	\N	\N	f	\N	\N
571	Load In		2026-02-13 16:00:00	\N	Load In		2026-02-13	0	First Show - FEB 13	{"John  Jacob"}	1	\N	\N	f	\N	\N
579	Truck Loaded		2026-03-13 00:30:00	\N	Truck Load	Truck dock 1	2026-03-12	0	Camp Okizu	{"Drew Johnson","Jalen Russell"}	1	\N	\N	f	\N	\N
596	Stage Setup In Meadow	Stage being set for build. 	2026-02-14 18:00:00	\N	Load In		2026-02-14	0	Microsoft at Filoli	{}	1	5	\N	f	\N	\N
594	Load In	Load in the Meadow	2026-02-14 17:00:00	\N	Load In		2026-02-14	0	Microsoft at Filoli	{"Drew Johnson"}	1	5	\N	f	\N	\N
605	Morning Session		2026-02-15 17:30:00	2026-02-15 20:00:00	Show		2026-02-15	0	Microsoft at Filoli	{}	1	\N	\N	f	\N	\N
606	Lunch		2026-02-15 20:00:00	2026-02-15 21:00:00	Meal		2026-02-15	0	Microsoft at Filoli	{}	1	\N	\N	f	\N	\N
607	Afternoon Session		2026-02-15 21:00:00	2026-02-15 00:00:00	Show		2026-02-15	0	Microsoft at Filoli	{}	1	\N	\N	f	\N	\N
613	Main Stage - Act 1		2026-02-16 21:00:00	2026-02-16 22:00:00	Show		2026-02-16	0	Microsoft at Filoli	{}	1	\N	\N	f	\N	\N
614	Main Stage - Act 2		2026-02-16 23:00:00	2026-02-16 00:30:00	Show		2026-02-16	0	Microsoft at Filoli	{}	1	\N	\N	f	\N	\N
585	Load In		2026-02-14 16:00:00	2026-02-14 18:00:00	Load In		2026-02-14	0	Fourth Show- FEB 16	{}	1	\N	\N	f	\N	\N
586	Stage Setup		2026-02-14 18:00:00	2026-02-14 20:00:00	Load In		2026-02-14	0	Fourth Show- FEB 16	{}	1	\N	\N	f	\N	\N
587	Lunch		2026-02-14 20:00:00	2026-02-14 21:00:00	Meal		2026-02-14	0	Fourth Show- FEB 16	{}	1	\N	\N	f	\N	\N
588	Sound Check		2026-02-14 22:00:00	2026-02-14 00:00:00	Sound Check		2026-02-14	0	Fourth Show- FEB 16	{}	1	\N	\N	f	\N	\N
591	Show		2026-02-14 04:00:00	2026-02-14 06:00:00	Show		2026-02-14	0	Fourth Show- FEB 16	{}	1	\N	\N	f	\N	\N
617	Load In		2026-02-16 16:00:00	2026-02-16 18:00:00	Load In		2026-02-16	0	Fourth Show- FEB 16	{}	1	\N	\N	f	\N	\N
598	Sound Check		2026-02-14 22:00:00	2026-02-14 00:00:00	Sound Check		2026-02-14	0	Microsoft at Filoli	{}	1	\N	\N	f	\N	\N
601	Show		2026-02-14 04:00:00	2026-02-14 06:00:00	Show		2026-02-14	0	Microsoft at Filoli	{}	1	\N	\N	f	\N	\N
618	Stage Setup		2026-02-16 18:00:00	2026-02-16 20:00:00	Load In		2026-02-16	0	Fourth Show- FEB 16	{}	1	\N	\N	f	\N	\N
619	Lunch		2026-02-16 20:00:00	2026-02-16 21:00:00	Meal		2026-02-16	0	Fourth Show- FEB 16	{}	1	\N	\N	f	\N	\N
621	Dinner		2026-02-16 01:00:00	2026-02-16 02:00:00	Meal		2026-02-16	0	Fourth Show- FEB 16	{}	1	\N	\N	f	\N	\N
623	Show		2026-02-16 04:00:00	2026-02-16 06:00:00	Show		2026-02-16	0	Fourth Show- FEB 16	{}	1	\N	\N	f	\N	\N
543	Load In		2026-03-13 18:00:00	\N	Load In	Main Stage	2026-03-13	0	Camp Okizu	{"Drew Johnson","Alexander Ma"}	1	\N	3	f	\N	\N
581	Start work and Tune		2026-03-14 20:00:00	2026-03-14 21:00:00	Tune	Main Stage	2026-03-14	0	Camp Okizu	{"Alexander Ma"}	1	\N	5	f	\N	\N
625	Lunch		2026-03-11 20:00:00	2026-03-11 21:00:00	Meal		2026-03-11	0	Camp Okizu	{"Alexander Ma","Drew Johnson"}	1	\N	\N	f	\N	\N
769	Load In		2026-03-11 15:00:00	2026-03-11 17:00:00	Load In		2026-03-11	0	Los Angeles	{}	1	\N	\N	f	\N	\N
770	Stage Setup		2026-03-11 17:00:00	2026-03-11 19:00:00	Load In		2026-03-11	0	Los Angeles	{}	1	\N	\N	f	\N	\N
771	Lunch		2026-03-11 19:00:00	2026-03-11 20:00:00	Meal		2026-03-11	0	Los Angeles	{}	1	\N	\N	f	\N	\N
776	Load In		2026-03-13 15:00:00	2026-03-13 17:00:00	Load In		2026-03-13	0	San Francisco	{}	1	\N	\N	f	\N	\N
777	Stage Setup		2026-03-13 17:00:00	2026-03-13 19:00:00	Load In		2026-03-13	0	San Francisco	{}	1	\N	\N	f	\N	\N
778	Lunch		2026-03-13 19:00:00	2026-03-13 20:00:00	Meal		2026-03-13	0	San Francisco	{}	1	\N	\N	f	\N	\N
782	Show		2026-03-13 03:00:00	2026-03-13 05:00:00	Show		2026-03-13	0	San Francisco	{}	1	\N	\N	f	\N	\N
688	Auto Load		2026-03-02 10:00:00	2026-03-02 12:00:00	Load In	\N	2026-03-02	0	Auto Test Show	{}	13	\N	\N	f	\N	\N
690	Sound Check		2026-03-01 14:00:00	2026-03-01 15:00:00	Sound Check	Main Stage	2026-03-01	0	Test Show	{}	17	\N	\N	f	\N	\N
691	Doors Open		2026-03-01 22:05:00	2026-03-01 23:05:00	Doors Open		2026-03-01	0	Test Show	{}	17	\N	\N	f	\N	\N
692	Sound Check		2026-03-01 22:08:00	2026-03-01 23:08:00	Show	Main Stage	2026-03-01	0	Gantt Show	{}	18	\N	\N	f	\N	\N
693	Doors Open		2026-03-01 22:09:00	2026-03-01 23:09:00	Show		2026-03-01	0	Gantt Show	{}	18	\N	\N	f	\N	\N
694	Sound Check Updated		2026-03-01 22:45:00	2026-03-01 23:45:00	Show	Main Stage	2026-03-01	0	Test Show	{}	19	\N	\N	t	\N	\N
696	Load In	\N	2026-03-01 09:00:00	2026-03-01 11:00:00	Show	\N	2026-03-01	0	My Show	\N	20	\N	\N	t	2026-03-01 22:51:22.132	375b35f9-dad3-4622-95cd-28b214cf12b0
448	Load In		2026-03-13 16:00:00	2026-03-13 01:00:00	Load In	Festival Pavillion	2026-03-13	0	Camp Okizu	{"Drew Johnson","Alexander Ma"}	1	\N	5	f	\N	\N
772	Sound Check		2026-03-11 21:00:00	2026-03-11 23:00:00	Sound Check		2026-03-11	0	Los Angeles	{}	1	\N	\N	f	\N	\N
773	Dinner		2026-03-11 00:00:00	2026-03-11 01:00:00	Meal		2026-03-11	0	Los Angeles	{}	1	\N	\N	f	\N	\N
774	Doors Open		2026-03-11 02:00:00	2026-03-11 02:30:00	Doors Open		2026-03-11	0	Los Angeles	{}	1	\N	\N	f	\N	\N
775	Show		2026-03-11 03:00:00	2026-03-11 05:00:00	Show		2026-03-11	0	Los Angeles	{}	1	\N	\N	f	\N	\N
753	Load In		2026-03-09 15:00:00	2026-03-09 17:00:00	Load In		2026-03-09	0	Berkeley,Ca	{}	1	\N	\N	f	\N	\N
754	Stage Setup		2026-03-09 17:00:00	2026-03-09 19:00:00	Load In		2026-03-09	0	Berkeley,Ca	{}	1	\N	\N	f	\N	\N
755	Lunch		2026-03-09 19:00:00	2026-03-09 20:00:00	Meal		2026-03-09	0	Berkeley,Ca	{}	1	\N	\N	f	\N	\N
756	Sound Check		2026-03-09 21:00:00	2026-03-09 23:00:00	Sound Check		2026-03-09	0	Berkeley,Ca	{}	1	\N	\N	f	\N	\N
757	Dinner		2026-03-09 00:00:00	2026-03-09 01:00:00	Meal		2026-03-09	0	Berkeley,Ca	{}	1	\N	\N	f	\N	\N
758	Doors Open		2026-03-09 02:00:00	2026-03-09 02:30:00	Doors Open		2026-03-09	0	Berkeley,Ca	{}	1	\N	\N	f	\N	\N
759	Show		2026-03-09 03:00:00	2026-03-09 05:00:00	Show		2026-03-09	0	Berkeley,Ca	{}	1	\N	\N	f	\N	\N
\.


--
-- Data for Name: sections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sections (id, name, description, event_id, sort_order, workspace_id) FROM stdin;
3	Live Auction	\N	49	0	1
4	Silent Auction	\N	49	1	1
5	Main Stage	\N	49	2	1
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (sid, sess, expire) FROM stdin;
zG4NWP6Y7HeZ6iX06B93r_baNCn2BBzC	{"cookie": {"path": "/", "secure": false, "expires": "2026-03-08T22:03:22.519Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "8e2a0d5c-8781-4efd-9713-8aeb6ef1e00f"}	2026-03-08 22:05:47
6492TYa6yt1hJbeqR2JS7A3wWMRA9mzM	{"cookie": {"path": "/", "secure": false, "expires": "2026-03-10T17:24:12.022Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "3e0cd90d-a738-4680-b7e2-443887d0cc2c"}	2026-03-10 17:24:43
5nvSosTm6gIqKU3jRxkkQn_n15IEFoOa	{"cookie": {"path": "/", "secure": false, "expires": "2026-03-08T23:36:03.449Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "3e0cd90d-a738-4680-b7e2-443887d0cc2c"}	2026-03-08 23:36:33
ua4ikpPfUWQo3PnjFYL7QFEmqOv0zdf5	{"cookie": {"path": "/", "secure": false, "expires": "2026-03-08T21:24:56.869Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "cb80a7ee-2ba1-4f54-8fb8-de2b39e07a2e"}	2026-03-08 21:25:36
TAubDCPuY1oXALFWFlerg78-ZcmJEy3R	{"cookie": {"path": "/", "secure": false, "expires": "2026-03-10T02:11:08.193Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "b9c6b203-d659-4f9c-be4c-e7da704fabe7"}	2026-03-10 02:13:33
QzV2LTbjBvqqHb8Y4BdbLG0VmkU2h-g-	{"cookie": {"path": "/", "secure": false, "expires": "2026-03-08T17:20:58.671Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "21170168-f9d5-4032-820c-6063f1b02366"}	2026-03-08 17:21:27
FFyOLMcFMGh2S2ye2zjqsnTgz3Upyfwa	{"cookie": {"path": "/", "secure": false, "expires": "2026-03-10T15:52:00.566Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "5794e363-09c8-4173-857a-29173f2843a1"}	2026-03-10 15:52:01
dXIzrlp7NT9F0XStGmlrVWSj8wyDIJ4L	{"cookie": {"path": "/", "secure": false, "expires": "2026-03-08T21:55:43.773Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "67896a15-8973-4ab8-a87d-db8f63fe6ed4"}	2026-03-08 21:56:45
XH41Wvclc5DVLphM7CLWipR_0bi4xBO4	{"cookie": {"path": "/", "secure": false, "expires": "2026-03-10T13:55:49.458Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "a2dd2849-6a4d-4ae3-8a0f-1ee6e86990cc"}	2026-03-10 13:57:00
HZMtiHLiQ0eOVQWz9NHlHq-IZ11MmA4i	{"cookie": {"path": "/", "secure": false, "expires": "2026-03-08T14:54:45.441Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "a7b98857-1865-468a-a36e-3cc5e98bf995"}	2026-03-08 14:55:15
WYaHurvj3IjpbzPrrttn-Opmnc3VDU0U	{"cookie": {"path": "/", "secure": false, "expires": "2026-03-10T17:20:53.761Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "3e0cd90d-a738-4680-b7e2-443887d0cc2c"}	2026-03-10 17:21:47
U9WGEXr0VigJHGX76VVQzAYnpepx54Tc	{"cookie": {"path": "/", "secure": false, "expires": "2026-03-08T22:44:52.186Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "66bc3b91-84a7-4e45-a7dd-75443c491e06"}	2026-03-08 22:47:47
joyTxaM6hT-idKQWXKdsNvq_ZoSgb9sB	{"cookie": {"path": "/", "secure": false, "expires": "2026-03-08T16:42:41.177Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "3e0cd90d-a738-4680-b7e2-443887d0cc2c"}	2026-03-10 18:00:02
NzRKMq8PdxKRaJWuAgCGrtxALhTuFtbw	{"cookie": {"path": "/", "secure": false, "expires": "2026-03-08T22:49:12.567Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "375b35f9-dad3-4622-95cd-28b214cf12b0"}	2026-03-08 22:51:27
34wKIRaDJvPe1Bzy_90oYnexs-C-tQ2F	{"cookie": {"path": "/", "secure": false, "expires": "2026-03-07T19:02:57.306Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "3e0cd90d-a738-4680-b7e2-443887d0cc2c"}	2026-03-07 19:03:54
YThQFTTBK7ZRnxUiVc7g_U0ExTG2iMrB	{"cookie": {"path": "/", "secure": false, "expires": "2026-03-07T18:46:49.130Z", "httpOnly": true, "originalMaxAge": 604800000}}	2026-03-07 18:47:31
AuX3H24H7fgZ9K3vN-9xIgPqckne1xP2	{"cookie": {"path": "/", "secure": false, "expires": "2026-03-08T22:07:30.843Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "dad5d4d8-5808-4dbe-b304-af6e142895fb"}	2026-03-08 22:09:22
Ps7AwfQ-7zq3PHpkUPZsEvIbzr4sbUB9	{"cookie": {"path": "/", "secure": false, "expires": "2026-03-08T17:58:49.059Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "cbd4054a-735a-42a0-8507-d395e85b412f"}	2026-03-08 18:01:33
41vC2567rCsAausBqvjW2or3UIbwcnnT	{"cookie": {"path": "/", "secure": false, "expires": "2026-03-08T23:28:51.401Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "3e0cd90d-a738-4680-b7e2-443887d0cc2c"}	2026-03-08 23:29:14
7Mufxo2VSd7TsjjQNUk8omgiHBJZDg8q	{"cookie": {"path": "/", "secure": false, "expires": "2026-03-08T10:22:08.589Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "30e4fcb2-dbbd-4681-a626-9e9c8b90f42f"}	2026-03-08 10:23:12
36bUTtuWGhxXUDoJ56cYYgK5ng7H9s65	{"cookie": {"path": "/", "secure": false, "expires": "2026-03-10T15:49:43.573Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "1bf04093-9dd0-4c1a-bd2a-970d0cc58757"}	2026-03-10 15:49:44
QI1_VjPnTpgw7uhQnOyfn6MrJWgnc8nR	{"cookie": {"path": "/", "secure": false, "expires": "2026-03-08T23:13:14.722Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "3e0cd90d-a738-4680-b7e2-443887d0cc2c"}	2026-03-08 23:14:11
PXH-1v7wa-XCSEzufJYXzHdxp-QRPw-M	{"cookie": {"path": "/", "secure": false, "expires": "2026-03-08T21:20:43.490Z", "httpOnly": true, "originalMaxAge": 604800000}}	2026-03-08 21:22:10
G2FZltO9cY1AjW_oU2aWLvIfEB_SWNnO	{"cookie": {"path": "/", "secure": false, "expires": "2026-03-09T18:58:01.475Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "3e0cd90d-a738-4680-b7e2-443887d0cc2c"}	2026-03-09 18:59:11
UO12hrMUMnhWbuMIWw7DJgGkeLlcGJp1	{"cookie": {"path": "/", "secure": false, "expires": "2026-03-10T22:33:55.988Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "3e0cd90d-a738-4680-b7e2-443887d0cc2c"}	2026-03-11 19:30:22
HWA1qMZErFgyCmi6mv8jrCIv1Xr27Ys1	{"cookie": {"path": "/", "secure": false, "expires": "2026-03-10T03:21:33.413Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "11360360-0b64-483f-a981-24fdfb760ed3"}	2026-03-10 03:23:36
fdI0uFoSgkMG_qvahS6Xzljg3TJq0wyt	{"cookie": {"path": "/", "secure": false, "expires": "2026-03-09T14:12:57.699Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "ed37a8b1-2c28-4a1d-b3ad-f5cb04fcddd8"}	2026-03-09 14:13:04
87ftZOY1jaJEG-PBMDGtrrM5yiLJHw0U	{"cookie": {"path": "/", "secure": false, "expires": "2026-03-09T00:11:46.124Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "3e0cd90d-a738-4680-b7e2-443887d0cc2c"}	2026-03-09 00:14:19
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.settings (key, value, id, workspace_id) FROM stdin;
bannerTitle_2026-02-11	Apple	4	1
lastSeenActivity_ed37a8b1-2c28-4a1d-b3ad-f5cb04fcddd8	2026-03-02T14:12:58.126Z	6	21
lastSeenActivity_fb7e64ae-5e69-4176-baa5-767c7fb7662d	2026-03-02T20:54:03.035Z	7	1
lastSeenActivity_b9c6b203-d659-4f9c-be4c-e7da704fabe7	2026-03-03T02:11:38.866Z	9	1
lastSeenActivity_11360360-0b64-483f-a981-24fdfb760ed3	2026-03-03T03:22:16.958Z	11	24
lastSeenActivity_a2dd2849-6a4d-4ae3-8a0f-1ee6e86990cc	2026-03-03T13:55:49.907Z	12	25
lastSeenActivity_b9c6b203-d659-4f9c-be4c-e7da704fabe7	2026-03-03T02:11:08.302Z	8	1
lastSeenActivity_11360360-0b64-483f-a981-24fdfb760ed3	2026-03-03T03:21:33.689Z	10	1
lastSeenActivity_1bf04093-9dd0-4c1a-bd2a-970d0cc58757	2026-03-03T15:49:43.674Z	13	1
lastSeenActivity_5794e363-09c8-4173-857a-29173f2843a1	2026-03-03T15:52:00.631Z	14	1
lastSeenActivity_3e0cd90d-a738-4680-b7e2-443887d0cc2c	2026-03-03T17:26:08.604Z	5	1
\.


--
-- Data for Name: system_invites; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_invites (id, email, role, token, invited_by, status, created_at) FROM stdin;
\.


--
-- Data for Name: task_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_types (id, name, is_default, workspace_id) FROM stdin;
1	Crew Call	f	1
2	Gear Pull	f	1
3	EOD	f	1
4	Prep	f	1
5	Show	t	1
6	Sound Check	t	1
7	Load In	t	1
8	Load Out	t	1
9	Meal	t	1
10	Coffee Break	t	1
11	Travel	t	1
12	Press	t	1
13	Paper Tech	t	1
14	Client Walkthrough	t	1
15	Equipment Dropoff	t	1
16	Equipment Pickup	t	1
17	Rehearsal	t	1
18	Tech Rehearsal	t	1
19	Doors Open	t	1
20	VIP Reception	t	1
21	Meet & Greet	t	1
22	Changeover	t	1
23	Curfew	t	1
24	Strike	t	1
25	Truck Load	f	1
26	Tune	f	1
28	Show	t	10
29	Sound Check	t	10
30	Load In	t	10
31	Load Out	t	10
32	Meal	t	10
33	Coffee Break	t	10
34	Travel	t	10
35	Press	t	10
36	Paper Tech	t	10
37	Client Walkthrough	t	10
38	Equipment Dropoff	t	10
39	Equipment Pickup	t	10
40	Rehearsal	t	10
41	Tech Rehearsal	t	10
42	Doors Open	t	10
43	VIP Reception	t	10
44	Meet & Greet	t	10
45	Changeover	t	10
46	Curfew	t	10
47	Strike	t	10
48	Show	t	11
49	Sound Check	t	11
50	Load In	t	11
51	Load Out	t	11
52	Meal	t	11
53	Coffee Break	t	11
54	Travel	t	11
55	Press	t	11
56	Paper Tech	t	11
57	Client Walkthrough	t	11
58	Equipment Dropoff	t	11
59	Equipment Pickup	t	11
60	Rehearsal	t	11
61	Tech Rehearsal	t	11
62	Doors Open	t	11
63	VIP Reception	t	11
64	Meet & Greet	t	11
65	Changeover	t	11
66	Curfew	t	11
67	Strike	t	11
68	Show	t	12
69	Sound Check	t	12
70	Load In	t	12
71	Load Out	t	12
72	Meal	t	12
73	Coffee Break	t	12
74	Travel	t	12
75	Press	t	12
76	Paper Tech	t	12
77	Client Walkthrough	t	12
78	Equipment Dropoff	t	12
79	Equipment Pickup	t	12
80	Rehearsal	t	12
81	Tech Rehearsal	t	12
82	Doors Open	t	12
83	VIP Reception	t	12
84	Meet & Greet	t	12
85	Changeover	t	12
86	Curfew	t	12
87	Strike	t	12
88	Show	t	13
89	Sound Check	t	13
90	Load In	t	13
91	Load Out	t	13
92	Meal	t	13
93	Coffee Break	t	13
94	Travel	t	13
95	Press	t	13
96	Paper Tech	t	13
97	Client Walkthrough	t	13
98	Equipment Dropoff	t	13
99	Equipment Pickup	t	13
100	Rehearsal	t	13
101	Tech Rehearsal	t	13
102	Doors Open	t	13
103	VIP Reception	t	13
104	Meet & Greet	t	13
105	Changeover	t	13
106	Curfew	t	13
107	Strike	t	13
108	Show	t	15
109	Show	t	15
110	Sound Check	t	15
111	Sound Check	t	15
112	Load In	t	15
113	Load In	t	15
114	Load Out	t	15
115	Load Out	t	15
116	Meal	t	15
117	Meal	t	15
118	Coffee Break	t	15
119	Coffee Break	t	15
120	Travel	t	15
121	Travel	t	15
122	Press	t	15
123	Press	t	15
124	Paper Tech	t	15
125	Paper Tech	t	15
126	Client Walkthrough	t	15
127	Client Walkthrough	t	15
128	Equipment Dropoff	t	15
129	Equipment Dropoff	t	15
130	Equipment Pickup	t	15
131	Equipment Pickup	t	15
132	Rehearsal	t	15
133	Rehearsal	t	15
134	Tech Rehearsal	t	15
135	Tech Rehearsal	t	15
136	Doors Open	t	15
137	Doors Open	t	15
138	VIP Reception	t	15
139	VIP Reception	t	15
140	Meet & Greet	t	15
141	Meet & Greet	t	15
142	Changeover	t	15
143	Changeover	t	15
144	Curfew	t	15
145	Curfew	t	15
146	Strike	t	15
147	Strike	t	15
148	Show	t	16
149	Sound Check	t	16
150	Load In	t	16
151	Load Out	t	16
152	Meal	t	16
153	Coffee Break	t	16
154	Travel	t	16
155	Press	t	16
156	Paper Tech	t	16
157	Client Walkthrough	t	16
158	Equipment Dropoff	t	16
159	Equipment Pickup	t	16
160	Rehearsal	t	16
161	Tech Rehearsal	t	16
162	Doors Open	t	16
163	VIP Reception	t	16
164	Meet & Greet	t	16
165	Changeover	t	16
166	Curfew	t	16
167	Strike	t	16
168	Show	t	17
169	Sound Check	t	17
170	Load In	t	17
171	Load Out	t	17
172	Meal	t	17
173	Coffee Break	t	17
174	Travel	t	17
175	Press	t	17
176	Paper Tech	t	17
177	Client Walkthrough	t	17
178	Equipment Dropoff	t	17
179	Equipment Pickup	t	17
180	Rehearsal	t	17
181	Tech Rehearsal	t	17
182	Doors Open	t	17
183	VIP Reception	t	17
184	Meet & Greet	t	17
185	Changeover	t	17
186	Curfew	t	17
187	Strike	t	17
188	Show	t	18
189	Sound Check	t	18
190	Load In	t	18
191	Load Out	t	18
192	Meal	t	18
193	Coffee Break	t	18
194	Travel	t	18
195	Press	t	18
196	Paper Tech	t	18
197	Client Walkthrough	t	18
198	Equipment Dropoff	t	18
199	Equipment Pickup	t	18
200	Rehearsal	t	18
201	Tech Rehearsal	t	18
202	Doors Open	t	18
203	VIP Reception	t	18
204	Meet & Greet	t	18
205	Changeover	t	18
206	Curfew	t	18
207	Strike	t	18
208	Show	t	19
209	Sound Check	t	19
210	Load In	t	19
211	Load Out	t	19
212	Meal	t	19
213	Coffee Break	t	19
214	Travel	t	19
215	Press	t	19
216	Paper Tech	t	19
217	Client Walkthrough	t	19
218	Equipment Dropoff	t	19
219	Equipment Pickup	t	19
220	Rehearsal	t	19
221	Tech Rehearsal	t	19
222	Doors Open	t	19
223	VIP Reception	t	19
224	Meet & Greet	t	19
225	Changeover	t	19
226	Curfew	t	19
227	Strike	t	19
228	Show	t	20
229	Sound Check	t	20
230	Load In	t	20
231	Load Out	t	20
232	Meal	t	20
233	Coffee Break	t	20
234	Travel	t	20
235	Press	t	20
236	Paper Tech	t	20
237	Client Walkthrough	t	20
238	Equipment Dropoff	t	20
239	Equipment Pickup	t	20
240	Rehearsal	t	20
241	Tech Rehearsal	t	20
242	Doors Open	t	20
243	VIP Reception	t	20
244	Meet & Greet	t	20
245	Changeover	t	20
246	Curfew	t	20
247	Strike	t	20
248	Show	t	21
249	Sound Check	t	21
250	Load In	t	21
251	Load Out	t	21
252	Meal	t	21
253	Coffee Break	t	21
254	Travel	t	21
255	Press	t	21
256	Paper Tech	t	21
257	Client Walkthrough	t	21
258	Equipment Dropoff	t	21
259	Equipment Pickup	t	21
260	Rehearsal	t	21
261	Tech Rehearsal	t	21
262	Doors Open	t	21
263	VIP Reception	t	21
264	Meet & Greet	t	21
265	Changeover	t	21
266	Curfew	t	21
267	Strike	t	21
268	Show	t	24
269	Sound Check	t	24
270	Load In	t	24
271	Load Out	t	24
272	Meal	t	24
273	Coffee Break	t	24
274	Travel	t	24
275	Press	t	24
276	Paper Tech	t	24
277	Client Walkthrough	t	24
278	Equipment Dropoff	t	24
279	Equipment Pickup	t	24
280	Rehearsal	t	24
281	Tech Rehearsal	t	24
282	Doors Open	t	24
283	VIP Reception	t	24
284	Meet & Greet	t	24
285	Changeover	t	24
286	Curfew	t	24
287	Strike	t	24
288	Show	t	25
289	Sound Check	t	25
290	Load In	t	25
291	Load Out	t	25
292	Meal	t	25
293	Coffee Break	t	25
294	Travel	t	25
295	Press	t	25
296	Paper Tech	t	25
297	Client Walkthrough	t	25
298	Equipment Dropoff	t	25
299	Equipment Pickup	t	25
300	Rehearsal	t	25
301	Tech Rehearsal	t	25
302	Doors Open	t	25
303	VIP Reception	t	25
304	Meet & Greet	t	25
305	Changeover	t	25
306	Curfew	t	25
307	Strike	t	25
\.


--
-- Data for Name: timesheet_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.timesheet_entries (id, event_id, date, employee_name, "position", time_in, meal_break_out, meal_break_in, time_out, paid_meal_break, total_hours, initials, workspace_id) FROM stdin;
12	49	2026-03-13	Drew Johnson	Acct Manager	2pm	\N	\N	10pm	t	8h	\N	1
11	49	2026-03-13	Alexander Ma	FOH/SYSTECH	2pm	\N	\N	10pm	t	8h	\N	1
13	49	2026-02-28	Alexander Ma	FOH/SYSTECH	\N	\N	\N	\N	t	\N	\N	1
14	49	2026-02-28	Drew Johnson	Acct Manager	\N	\N	\N	\N	t	\N	\N	1
15	49	2026-03-02			\N	\N	\N	\N	t	\N	\N	1
16	70	2026-03-01	John  Jacob	Patch	\N	\N	\N	\N	t	\N	\N	1
17	70	2026-03-01	Drew Johnson	Acct Manager	\N	\N	\N	\N	t	\N	\N	1
18	70	2026-03-01	Jalen Russell	MONS	\N	\N	\N	\N	t	\N	\N	1
19	70	2026-03-01	Alexander Ma	MONS	13:00	\N	\N	\N	t		\N	1
20	70	2026-03-02	Jalen Russell	MONS	\N	\N	\N	\N	t	\N	\N	1
21	70	2026-03-02	Alexander Ma	MONS	\N	\N	\N	\N	t	\N	\N	1
23	70	2026-03-02	Drew Johnson	Acct Manager	\N	\N	\N	\N	t	\N	\N	1
22	70	2026-03-02	John  Jacob	Patch	\N	\N	\N	\N	t	\N	\N	1
\.


--
-- Data for Name: travel_days; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.travel_days (id, project_id, date, notes, workspace_id, flight_number, airline, departure_airport, arrival_airport, departure_time, arrival_time) FROM stdin;
2	14	2026-03-12	\N	1	\N	\N	\N	\N	\N	\N
4	14	2026-03-14	\N	1	\N	\N	\N	\N	\N	\N
5	14	2026-03-10	\N	1	\N	\N	\N	\N	\N	\N
6	14	2026-03-08	\N	1	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, first_name, last_name, profile_image_url, role, created_at, updated_at, password_hash, phone, department, workspace_id, super_admin, last_active_at, push_token) FROM stdin;
1bf04093-9dd0-4c1a-bd2a-970d0cc58757	test-filter-user@example.com	Filter	Tester	\N	commenter	2026-03-03 15:49:43.568312	2026-03-03 15:49:43.568312	$2b$10$rW87EjotYsX55TquoaOhxuyfEeV5vksy.6Q3eOxKlLX2T.I.4Hcpm	\N	PRODUCTION	26	f	2026-03-03 15:49:43.591	\N
a80ca9ee-2cd2-456f-bccf-ccc231c4d4b2	schedtest_4Sq635@example.com	Schedule	Tester	\N	commenter	2026-02-11 04:00:35.387663	2026-02-11 04:00:35.387663	$2b$10$CFyviMKPgF0Cj/C3FdD/7OkHt.VP5xQqENDM4Q7at6agVJ/jOjzUi	5551234567	AUDIO	6	f	\N	\N
3e0cd90d-a738-4680-b7e2-443887d0cc2c	dj.soundimage@gmail.com	DJ	SoundImage	\N	manager	2026-02-09 05:51:28.312147	2026-02-11 02:53:54.227	$2b$10$Hr1mEsHYwGm6LTTBOnwGQeZuHrxLOB72a6jvL1jwFulxWTCLfWGZW	5106914462	AUDIO	1	t	2026-03-04 19:30:21.866	\N
b7d7f082-471e-4a81-bc95-21ae20df7105	testuser_GtXnVO@example.com	Test	User	\N	commenter	2026-02-12 02:16:14.354824	2026-02-12 02:16:14.354824	$2b$10$QSuaqSB5edgJaBmPdXCwwu.QDrzPnSzTcmh2ist/ryDlSoiauiGBG	\N	PRODUCTION	7	f	\N	\N
62a74c27-862b-49c4-9ceb-7546ec233295	sectiontest_5VU_Dv@example.com	Section	Tester	\N	commenter	2026-02-13 19:54:51.882996	2026-02-13 19:54:51.882996	$2b$10$AMUIlWz4Oae60qv0HNro1.NsI7MV3aF6SS5ob3piMdTrRsViONua6	\N	AUDIO	8	f	\N	\N
a7b98857-1865-468a-a36e-3cc5e98bf995	noHqYu@example.com	Manager	User	\N	manager	2026-03-01 14:54:45.382456	2026-03-01 14:54:45.382456	$2b$10$YLSBPrn82I4YfNWC.BtNpuK5Izck.N8.fzpKaLEwL.R5cF8h2zAAy	(555) 123-4567	PRODUCTION	12	f	2026-03-01 14:54:45.465	\N
a2dd2849-6a4d-4ae3-8a0f-1ee6e86990cc	test-bulk-tour-user@example.com	BulkTour	Tester	\N	manager	2026-03-03 13:55:49.410723	2026-03-03 13:55:49.410723	$2b$10$t/XBVMDWMbF/joYUgUp8Z.YC3X5f3EcGm8Aj5JwaX2v9tBfqbKv3O	(555) 123-4567	PRODUCTION	25	f	2026-03-03 13:56:59.054	\N
21170168-f9d5-4032-820c-6063f1b02366	testmgr@example.com	Test	Manager	\N	manager	2026-03-01 17:20:58.525181	2026-03-01 17:20:58.525181	$2b$10$gIEtlSlANOkBOBaMhxkHAOrAhVOkV8NBSZhnnmxghwRfyN.WZNVGi	\N	AUDIO	13	f	2026-03-01 17:20:58.692	\N
6c44de74-33a9-4831-b04f-96c96f91428c	sorttest_g4ga8C@example.com	Sort	Tester	\N	commenter	2026-02-13 20:13:53.67272	2026-02-13 20:13:53.67272	$2b$10$UZfsGN4WmD/RN1.Y399I9u7hqP11XDgjOs.NtwGGNLF.1Ko22lIEW	\N	AUDIO	9	f	\N	\N
8e2a0d5c-8781-4efd-9713-8aeb6ef1e00f	ganttdetail@example.com	Gantt	Tester	\N	manager	2026-03-01 22:03:22.498724	2026-03-01 22:03:22.498724	$2b$10$Rwy58P5BP.zYJteaTxpgUOXUeT/LSgx2UH1K3p/8VNoArfVuS6E2u	(555) 555-0101	PRODUCTION	17	f	2026-03-01 22:05:46.661	\N
cb80a7ee-2ba1-4f54-8fb8-de2b39e07a2e	gantttest@example.com	Gantt	Tester	\N	commenter	2026-03-01 21:24:56.865774	2026-03-01 21:24:56.865774	$2b$10$h7NkQS1SrNtb.zwZEl6hjee6l8y5ll6Jr.M39yJlUEjsx2wn8Y6.S	\N	PRODUCTION	15	f	2026-03-01 21:24:56.909	\N
67896a15-8973-4ab8-a87d-db8f63fe6ed4	scrolltest@example.com	Scroll	Tester	\N	manager	2026-03-01 21:55:43.756678	2026-03-01 21:55:43.756678	$2b$10$OxGklB49Jruq78eYZVPQou5THjEoKmo3buSXIOmRXiRnIHrDjy.cW	\N	PRODUCTION	16	f	2026-03-01 21:56:44.055	\N
30e4fcb2-dbbd-4681-a626-9e9c8b90f42f	manager@example.com	Manager	User	\N	manager	2026-03-01 10:22:08.408866	2026-03-01 10:22:08.408866	$2b$10$UsvPBklnERAUwDFjtOKF2OA0QAgGoPpAWNCMN8SmAWPQojSMC7kFS	\N	PRODUCTION	11	f	2026-03-01 10:23:11.769	\N
cbd4054a-735a-42a0-8507-d395e85b412f	testmgr+run1@example.com	Test	Manager	\N	commenter	2026-03-01 17:58:48.98335	2026-03-01 17:58:48.98335	$2b$10$x1K3MakS9QSg5gOAA6D53uXuRglNaPqblJdiQ75CTuxFfynuMPhZO	(555) 123-4567	PRODUCTION	13	f	2026-03-01 18:01:02.022	\N
ed37a8b1-2c28-4a1d-b3ad-f5cb04fcddd8	auto.tester@example.com	Auto	Tester	\N	manager	2026-03-02 14:12:57.516293	2026-03-02 14:12:57.516293	$2b$10$ioLONzT6fuXNNL9HWyCoCugA1JfV5rrwI0yo8mGOg/WtEiVDKsZVK	\N	PRODUCTION	21	f	2026-03-02 14:12:57.725	\N
375b35f9-dad3-4622-95cd-28b214cf12b0	ganttv2@example.com	Test	User	\N	manager	2026-03-01 22:49:12.54844	2026-03-01 22:49:12.54844	$2b$10$FkdyzJm5NtlO00LtNH3Xe.syeLlX0lv672G/pQcpf3/K3NZ2kyj4K	\N	AUDIO	20	f	2026-03-01 22:51:22.121	\N
5794e363-09c8-4173-857a-29173f2843a1	test-filter-v2@example.com	Filter	Test	\N	commenter	2026-03-03 15:52:00.552078	2026-03-03 15:52:00.552078	$2b$10$ftfH8ZzDeXtxFZJ9hMaXh.GoFm8VlBQtnBjhNlOq7KBdiuTYwgCmS	\N	AUDIO	27	f	2026-03-03 15:52:00.584	\N
dad5d4d8-5808-4dbe-b304-af6e142895fb	ganttdetail2@example.com	Gantt	Tester2	\N	manager	2026-03-01 22:07:30.821266	2026-03-01 22:07:30.821266	$2b$10$.FLxtHIlbtX4h4idE3EQBOwHE8KaOv1v9ZgmtMwcSaecxIe1kGBTK	\N	AUDIO	18	f	2026-03-01 22:08:32.063	\N
66bc3b91-84a7-4e45-a7dd-75443c491e06	ganttactions@example.com	Gantt	Actions	\N	manager	2026-03-01 22:44:52.167465	2026-03-01 22:44:52.167465	$2b$10$ATFi2AZTPv1nsk1ZsWlifOPAK3.C0n9ZY4uzWL4kdUl/LxkJZ1j/y	(555) 000-0000	AUDIO	19	f	2026-03-01 22:47:15.405	\N
11360360-0b64-483f-a981-24fdfb760ed3	6-1PYF@example.com	John	Doe	\N	commenter	2026-03-03 03:21:33.338922	2026-03-03 03:21:33.338922	$2b$10$nbGSFAVe6JgNkVCAwf/Ea..nnRsupJ7jQztgELCxxXvhXjZ.ZovgG	(555) 123-4567	AUDIO	24	f	2026-03-03 03:23:35.719	\N
b9c6b203-d659-4f9c-be4c-e7da704fabe7	VNn5Vx@example.com	Test	User	\N	commenter	2026-03-03 02:11:08.101076	2026-03-03 02:11:08.101076	$2b$10$zaDngh.E2xIhrWI1vPrn6eshLqxarCZam3PyhhUxEv5rbkqg1NqBm	\N	AUDIO	1	f	2026-03-03 02:13:32.499	\N
\.


--
-- Data for Name: venues; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.venues (id, name, address, contact_name, contact_phone, wifi_ssid, wifi_password, notes, workspace_id, parking, load_in, capacity, dressing_rooms, dressing_rooms_notes, showers, showers_notes, laundry, laundry_notes, meals, meals_notes, tech_packet_url, latitude, longitude) FROM stdin;
13	Paramount Theater	2025 Broadway, Oakland, CA 94612	Jason Blackwell	5101231234				1	Parking pass will be issued on show day 	Truck will be marshalled in and dump at top of ramp, gear goes weeeeee on to stage. 		t	Yes but not for local guys 	t	not for local but yes	t	not for local but yes	walkaway	there are a lot of places to eat around the Paramount, click the link provided in the venue bar and youll see	\N	\N	\N
18	Filoli	86 Cañada Rd Woodside, CA 94062 United States					Don’t walk in the flowers. No smoking. 	1	Please park in the dirt employee lot 	Please go to coordinates,a gate code will be issued on a per show basis.. 37.46853° N, 122.30222° W	Varying 150-1500	f		f		f		walkaway	Will have meals delivered. 		\N	\N
4	SOUND IMAGE SFO	23529 Connecticut St	Drew Johnson	5106914462	Clair Secure 	press4ward!	Parking on street or in the rear. 	1	Ample Parking in the back and in the front, emails will be sent out when parking is restricted.	2 x Truck Docks 		f		f		f		walkaway	there are a lot of places to eat around the Shop, Click the link provided and youll see. 	\N	37.6412986	-122.1298510
15	Fort Mason Festival Pavillion	2 Marina Boulevard #260 Suite, San Francisco, CA 94123	N/A	+14153457500	N/A	N/A	No smoking in the hanger. 	1	Onsite. Pay and fill out expense sheet	Truck will back into the venue and drop gear at BOH		f		f		f		walkaway	Client provided on show day. 	\N	37.8068860	-122.4322073
7	Oracle Park 	24 King St San Francisco, CA  94107 United States	Drew Johnson	5106914462	PUBLIC	PUBLIC	Check in at Will Call on 2nd and King Walk down 2nd to the security and get screened. meet in outfield.	1	Please Park at Lot A there will be a Code provided	Trucking instructions in files tab, Trucks will be marshalled in 1 by 1. 		f		f		f		client_provided	Catering in the players training area, follow signs, or ask your manager.		37.7807534	-122.3888770
16	The Greek	2001 Gayley Rd, Berkeley, CA 94720	Drew Johnson	5106914462				1		Truck will be marshalled in from a pre-determined lot. flat push to stage 75 ft	5900	t		t		t		client_provided	catering is downstairs, you will need a meal ticket.	\N	37.8739639	-122.2555369
14	Warfield	982 Market St, San Francisco, CA 94102.	Jon G	14156371662				1	Public Parking Only, SOMETIMES a pass will be issued for parking behind the venue.	Truck pulls up to backdoor on Taylor St, flat push into stage	2400	t		t		t		walkaway		\N	37.7826218	-122.4103420
19	Kia Forum							1				f		f		f					\N	\N
17	The Regency	1300 Van Ness Ave, San Francisco, CA 94109	Drew Johnson	5106914462				1	Public Parking only, please submit an expense sheet, expense sheet in files	Load in through Side door	1423	t		t		t		walkaway		\N	\N	\N
\.


--
-- Data for Name: workspace_invites; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.workspace_invites (id, email, workspace_id, role, invited_by, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: workspace_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.workspace_members (id, workspace_id, user_id, role, created_at) FROM stdin;
1	1	3e0cd90d-a738-4680-b7e2-443887d0cc2c	manager	2026-02-10 21:03:00.78888
20	11	30e4fcb2-dbbd-4681-a626-9e9c8b90f42f	manager	2026-03-01 10:22:08.577767
21	12	a7b98857-1865-468a-a36e-3cc5e98bf995	manager	2026-03-01 14:54:45.427208
22	13	21170168-f9d5-4032-820c-6063f1b02366	manager	2026-03-01 17:20:58.66105
23	13	cbd4054a-735a-42a0-8507-d395e85b412f	manager	2026-03-01 17:59:13.954511
24	16	67896a15-8973-4ab8-a87d-db8f63fe6ed4	manager	2026-03-01 21:55:43.763398
25	17	8e2a0d5c-8781-4efd-9713-8aeb6ef1e00f	manager	2026-03-01 22:03:22.507439
26	18	dad5d4d8-5808-4dbe-b304-af6e142895fb	manager	2026-03-01 22:07:30.830811
27	19	66bc3b91-84a7-4e45-a7dd-75443c491e06	manager	2026-03-01 22:44:52.176492
28	20	375b35f9-dad3-4622-95cd-28b214cf12b0	manager	2026-03-01 22:49:12.556205
29	21	ed37a8b1-2c28-4a1d-b3ad-f5cb04fcddd8	manager	2026-03-02 14:12:57.683927
30	24	11360360-0b64-483f-a981-24fdfb760ed3	manager	2026-03-03 03:22:16.54231
31	25	a2dd2849-6a4d-4ae3-8a0f-1ee6e86990cc	manager	2026-03-03 13:55:49.442444
32	26	1bf04093-9dd0-4c1a-bd2a-970d0cc58757	commenter	2026-03-03 15:50:05.573234
33	27	5794e363-09c8-4173-857a-29173f2843a1	commenter	2026-03-03 15:52:12.721929
\.


--
-- Data for Name: workspaces; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.workspaces (id, name, owner_id, created_at) FROM stdin;
10	JERRY ATRIC's Workspace	0f016996-30c8-4f4b-a182-ff2a99764220	2026-02-24 22:52:26.944469
1	Sound Image	3e0cd90d-a738-4680-b7e2-443887d0cc2c	2026-02-10 21:03:00.784432
11	Test Org	30e4fcb2-dbbd-4681-a626-9e9c8b90f42f	2026-03-01 10:22:08.574061
12	Test Org	a7b98857-1865-468a-a36e-3cc5e98bf995	2026-03-01 14:54:45.41911
13	TestOrg	21170168-f9d5-4032-820c-6063f1b02366	2026-03-01 17:20:58.656536
15	GanttTestOrg	cb80a7ee-2ba1-4f54-8fb8-de2b39e07a2e	2026-03-01 21:25:29.170511
16	ScrollTestOrg	67896a15-8973-4ab8-a87d-db8f63fe6ed4	2026-03-01 21:55:43.760421
17	GanttDetailOrg	8e2a0d5c-8781-4efd-9713-8aeb6ef1e00f	2026-03-01 22:03:22.503966
18	GanttTestOrg2	dad5d4d8-5808-4dbe-b304-af6e142895fb	2026-03-01 22:07:30.826044
19	GanttActionsOrg	66bc3b91-84a7-4e45-a7dd-75443c491e06	2026-03-01 22:44:52.172434
20	TestOrg	375b35f9-dad3-4622-95cd-28b214cf12b0	2026-03-01 22:49:12.551974
21	Test Org	ed37a8b1-2c28-4a1d-b3ad-f5cb04fcddd8	2026-03-02 14:12:57.669172
23	Test Workspace	11360360-0b64-483f-a981-24fdfb760ed3	2026-03-03 03:22:00.649876
24	Test Workspace	11360360-0b64-483f-a981-24fdfb760ed3	2026-03-03 03:22:16.059309
25	Test Org for Bulk Tour	a2dd2849-6a4d-4ae3-8a0f-1ee6e86990cc	2026-03-03 13:55:49.425283
26	Filter Tester's Workspace	1bf04093-9dd0-4c1a-bd2a-970d0cc58757	2026-03-03 15:50:05.536948
27	Filter Test's Workspace	5794e363-09c8-4173-857a-29173f2843a1	2026-03-03 15:52:12.676885
\.


--
-- Data for Name: zones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.zones (id, name, description, venue_id, sort_order, workspace_id) FROM stdin;
1	BallRoom	Main Hall	17	0	1
2	Social Hall	\N	17	1	1
3	The Lodge	\N	17	2	1
4	Sunken Garden	\N	18	0	1
5	The Meadow	\N	18	1	1
6	Grand Dining Room	\N	18	2	1
7	Bay 1	\N	4	0	1
8	Bay 2	\N	4	1	1
\.


--
-- Name: activity_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.activity_log_id_seq', 189, true);


--
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.comments_id_seq', 20, true);


--
-- Name: contacts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contacts_id_seq', 333, true);


--
-- Name: crew_positions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.crew_positions_id_seq', 282, true);


--
-- Name: crew_travel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.crew_travel_id_seq', 23, true);


--
-- Name: daily_checkins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.daily_checkins_id_seq', 1, false);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.departments_id_seq', 240, true);


--
-- Name: event_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.event_assignments_id_seq', 79, true);


--
-- Name: event_day_venues_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.event_day_venues_id_seq', 76, true);


--
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.events_id_seq', 97, true);


--
-- Name: file_folders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.file_folders_id_seq', 9, true);


--
-- Name: files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.files_id_seq', 7, true);


--
-- Name: gear_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.gear_requests_id_seq', 1, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 345, true);


--
-- Name: project_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.project_assignments_id_seq', 10, true);


--
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.projects_id_seq', 15, true);


--
-- Name: schedule_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.schedule_templates_id_seq', 1, true);


--
-- Name: schedules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.schedules_id_seq', 782, true);


--
-- Name: sections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sections_id_seq', 7, true);


--
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.settings_id_seq', 14, true);


--
-- Name: system_invites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.system_invites_id_seq', 1, false);


--
-- Name: task_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.task_types_id_seq', 307, true);


--
-- Name: timesheet_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.timesheet_entries_id_seq', 23, true);


--
-- Name: travel_days_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.travel_days_id_seq', 6, true);


--
-- Name: venues_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.venues_id_seq', 19, true);


--
-- Name: workspace_invites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.workspace_invites_id_seq', 15, true);


--
-- Name: workspace_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.workspace_members_id_seq', 33, true);


--
-- Name: workspaces_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.workspaces_id_seq', 27, true);


--
-- Name: zones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.zones_id_seq', 8, true);


--
-- PostgreSQL database dump complete
--

\unrestrict jTvC9f4ZFlLmBp9psglOa3otgBvXrob4BZ78h61NhyBezcYhHYQ6dgQZNiy9KAR

