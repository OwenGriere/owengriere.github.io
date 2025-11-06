---
layout: single
permalink: /profile/
author_profile: false
toc: false 
show_title: false
classes: ["wide", "cvpage"]
---

This section contains my resume and detailed experience so that you can better understand the core of my projects.

## CV - [📄 Download my CV in PDF](/assets/docs/CV_academique.pdf)

![CV](/assets/images/CV_academique_1.jpg)| ![CV](/assets/images/CV_academique_2.jpg)

## Explanation of the various missions

### Internship - CRCT - Inserm - Toulouse

J’ai réalisé ce stage au **Centre de Recherche en Cancérologie de Toulouse (CRCT)**, au sein de l’équipe **NetB(IO)² – Network Biology for Immuno-Oncology**, dirigée par **Vera Pancaldi**. Cette équipe s’intéresse aux interactions entre cellules tumorales et immunitaires pour mieux comprendre la résistance des cancers aux traitements et proposer des approches de reprogrammation du micro-environnement tumoral (TME). Mon projet, financé par **Janssen**, portait sur l’**adénocarcinome canalaire pancréatique (PDAC)**, un cancer particulièrement agressif et difficile à traiter. L’objectif était d’utiliser la modélisation multi-agents et les données spatiales issues de patients pour analyser et simuler l’évolution du TME de ce cancer.

J’ai d’abord conçu un **modèle multi-agents avec PhysiCell** afin de représenter la dynamique du tissu tumoral, en incluant différents types cellulaires (cellules épithéliales et mésenchymateuses, macrophages, fibroblastes, lymphocytes T, etc.) et plusieurs processus biologiques essentiels tels que l’hypoxie, l’immunosuppression et la **transition épithélio-mésenchymateuse (EMT)**. Ce modèle visait à reproduire les interactions complexes entre cellules cancéreuses et système immunitaire et à simuler la progression tumorale dans un environnement biologique réaliste. Il a permis d’observer notamment le rôle central des macrophages M2 dans la suppression immunitaire et la structuration du stroma pancréatique.

En parallèle, j’ai développé un **pipeline d’analyse spatiale** des tissus à partir d’images **mIF (multiplex immunofluorescence)** et **IMC (Imaging Mass Cytometry)**, en m’appuyant sur deux outils conçus dans l’équipe : **Tysserand** (construction de réseaux cellulaires) et **MOSNA** (analyse multi-omique de réseaux spatiaux). J’ai encapsulé ces outils dans une **interface graphique interactive** afin de les rendre accessibles aux chercheurs du laboratoire pour la détection de niches cellulaires, le calcul d’assortativité et la comparaison de structures spatiales entre patients. Ces analyses ont permis de révéler des **zones immunosuppressives**, des **îlots homogènes de cellules cancéreuses** et des **structures lymphoïdes tertiaires** susceptibles d’influencer la réponse aux immunothérapies.

Enfin, j’ai amorcé un travail de **génération de réseaux tissulaires synthétiques** à partir de statistiques extraites de données réelles, en utilisant un **modèle de champ aléatoire de Markov (MRF)** et un **modèle de Potts** pour reproduire la répartition et les affinités cellulaires observées expérimentalement. Bien que ce pipeline reste à finaliser, il ouvre la voie à la création de **tissus artificiels simulés** permettant d’explorer de nouvelles hypothèses sans dépendre du coût ou de la rareté des données expérimentales.

Ce stage m’a permis de combiner des compétences en **biologie, modélisation mathématique, programmation scientifique et analyse spatiale**, tout en participant à un véritable projet de recherche translationnelle. J’ai pu acquérir une vision d’ensemble des approches modernes de **bio-informatique intégrative**, depuis la simulation numérique jusqu’à l’interprétation biologique, dans un cadre scientifique stimulant et pluridisciplinaire.

### Internship - Institut du Thorax - Inserm - Nantes

Ce stage, que j’ai réalisé à **l’Institut du Thorax (Inserm – Nantes)** sous la direction d'**Antoine Rimbert**, s’inscrit dans le domaine de la recherche en génomique appliquée aux maladies cardiovasculaires héréditaires. Mon objectif principal était d’étudier l’impact de variants génétiques non codants situés dans les **régions 5’UTR** de gènes clés impliqués dans les **dyslipidémies familiales**, notamment LDLR, APOB, PCSK9 et APOE. Ces régions, souvent négligées dans les analyses classiques, jouent pourtant un rôle essentiel dans la régulation de la traduction des protéines. J’ai donc cherché à identifier des mutations rares susceptibles d’altérer ce processus et de provoquer des formes familiales d’hypercholestérolémie.
Pour cela, j’ai mis en place une chaîne d’analyse complète s’appuyant sur deux outils bio-informatiques : ANNOVAR, pour l’annotation de variants génétiques au format VCF/BCF, et **MORFEE**, pour la détection et l’interprétation des mutations dans les régions 5’UTR. J’ai parallèlement développé un pipeline automatisé avec **Nextflow** afin de traiter efficacement de grands volumes de données issues de cohortes locales et de la base UK Biobank, représentant plus de 200 000 individus. Cette approche m’a permis de détecter plusieurs variants rares potentiellement pathogènes, d’en évaluer la significativité statistique et d’étendre l’analyse à l’ensemble du génome humain.
Ce travail m’a offert une immersion complète dans le domaine de la bio-informatique appliquée à la recherche médicale, tout en contribuant à une meilleure compréhension des mécanismes génétiques à l’origine des dyslipidémies familiales et à l’amélioration des outils de diagnostic préventif des maladies cardiovasculaires.

