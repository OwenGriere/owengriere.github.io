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

I completed this internship at the **Toulouse Cancer Research Center (CRCT)**, as part of the **NetB(IO)² – Network Biology for Immuno-Oncology** team, led by **Vera Pancaldi**. This team studies the interactions between tumor and immune cells to better understand cancer resistance to treatment and propose approaches for reprogramming the tumor microenvironment (TME). My project, funded by **Janssen**, focused on **pancreatic ductal adenocarcinoma (PDAC)**, a particularly aggressive and difficult-to-treat cancer. The goal was to use multi-agent modeling and spatial data from patients to analyze and simulate the evolution of the TME in this cancer.

I first designed a **multi-agent model with PhysiCell** to represent the dynamics of tumor tissue, including different cell types (epithelial and mesenchymal cells, macrophages, fibroblasts, T lymphocytes, etc.) and several essential biological processes such as hypoxia, immunosuppression, and **epithelial-mesenchymal transition (EMT)**. This model aimed to reproduce the complex interactions between cancer cells and the immune system and to simulate tumor progression in a realistic biological environment. In particular, it allowed us to observe the central role of M2 macrophages in immune suppression and the structuring of the pancreatic stroma.

At the same time, I developed a **spatial analysis pipeline** for tissues based on **mIF (multiplex immunofluorescence)** and **IMC (Imaging Mass Cytometry)** images, using two tools designed by the team: **Tysserand** (cell network construction) and **MOSNA** (multi-omic analysis of spatial networks). I encapsulated these tools in an **interactive graphical interface** to make them accessible to laboratory researchers for the detection of cell niches, the calculation of assortativity, and the comparison of spatial structures between patients. These analyses revealed **immunosuppressive zones**, **homogeneous islands of cancer cells**, and **tertiary lymphoid structures** that may influence the response to immunotherapies.

Finally, I began work on **generating synthetic tissue networks** from statistics extracted from real data, using a **Markov random field (MRF) model** and a **Potts model** to reproduce the distribution and cellular affinities observed experimentally. Although this pipeline has yet to be finalized, it paves the way for the creation of **simulated artificial tissues** that will allow new hypotheses to be explored without relying on costly or scarce experimental data.

This internship allowed me to combine skills in **biology, mathematical modeling, scientific programming, and spatial analysis**, while participating in a real translational research project. I was able to gain a comprehensive overview of modern approaches to **integrative bioinformatics**, from numerical simulation to biological interpretation, in a stimulating and multidisciplinary scientific environment.

### Internship - Institut du Thorax - Inserm - Nantes

This internship, which I completed at the **Thorax Institute (Inserm – Nantes)** under the supervision of **Antoine Rimbert**, was in the field of genomics research applied to hereditary cardiovascular diseases. My main objective was to study the impact of non-coding genetic variants located in the **5'UTR regions** of key genes involved in **familial dyslipidemia**, including LDLR, APOB, PCSK9, and APOE. These regions, often overlooked in conventional analyses, play an essential role in regulating protein translation. I therefore sought to identify rare mutations that could alter this process and cause familial forms of hypercholesterolemia.
To do this, I set up a comprehensive analysis chain based on two bioinformatics tools: ANNOVAR, for annotating genetic variants in VCF/BCF format, and MORFEE, for detecting and interpreting mutations in 5'UTR regions. At the same time, I developed an automated pipeline with **Nextflow** to efficiently process large volumes of data from local cohorts and the UK Biobank database, representing more than 200,000 individuals. This approach enabled me to detect several rare potentially pathogenic variants, assess their statistical significance, and extend the analysis to the entire human genome.
This work gave me a comprehensive immersion in the field of bioinformatics applied to medical research, while contributing to a better understanding of the genetic mechanisms underlying familial dyslipidemia and improving tools for the preventive diagnosis of cardiovascular disease.

