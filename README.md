# Mento
# Your own personal AI pantry manager

A full-stack pantry inventory management app powered by AI, designed to help households track what they have, predict when they'll run out, and reduce food waste.


## What It Does

Mento lets you build and manage a personal grocery inventory by scanning items with your camera. The app uses the **Claude Vision API** to identify grocery items from photos, then tracks usage patterns to predict depletion timelines, so you know what you need before you run out.

**Core features:**
- AI-powered item recognition via Claude Vision API
- Predictive depletion tracking based on usage history
- Real-time inventory management
- Open Food Facts API integration for nutritional and product data
- Responsive UI built for everyday household use


## My Role

This project was a product design and architecture initiative. My contributions:

- **Product conception**: defined the problem, user journey, and core feature set
- **Architecture decisions**: selected the tech stack, designed the data model, and scoped each sprint
- **Prompt engineering**: designed and iterated on the prompts used to instruct the Claude Vision API for accurate item identification and handling of edge cases (obscured labels, ambiguous packaging, low-light photos)
- **Failure mode design**: thought through how the app should behave when the model is uncertain, and designed fallback logic to handle misidentification gracefully
- **Sprint planning**: structured the project into five development sprints from MVP through local deployment

The implementation was built with AI-assisted development tools. My focus was on the product thinking, prompt strategy, and responsible AI design decisions that shaped how the system behaves.


## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 |
| Database | Supabase |
| AI Vision | Claude Vision API (Anthropic) |
| Product Data | Open Food Facts API |
| Deployment | Local (development) |

---

## Key Technical Decisions

**Why Claude Vision API?**
Tested multiple approaches for item identification. Claude Vision consistently handled real-world grocery packaging, including partially obscured labels and non-standard fonts, better than alternative approaches, and the API made it easy to iterate on prompt strategy without changing the underlying model.

**Handling model uncertainty**
One of the core design challenges was deciding what to do when the model was not confident in its identification. Rather than defaulting to a wrong guess, the app prompts the user to confirm or correct, prioritizing accuracy over seamless automation. This was a deliberate, responsible AI choice.

**Supabase for real-time data**
Chose Supabase over a simpler solution because the real-time database capabilities allowed the inventory to update immediately across the UI without page refreshes, which is important for a household tool that multiple people might use simultaneously.



## What I Learned so Far

- Prompt engineering is as much about failure handling as it is about happy path performance
- The hardest part of building an AI-powered product is not the model, it is deciding when to trust it and when to ask the human
- Architecture decisions made early (data model design, API structure) have an outsized impact on how fast you can iterate later
- Responsible AI use in a consumer product means designing for the cases where the model is wrong, not just the cases where it is right

---

## Status

Currently at local deployment. Planning to extend with cloud hosting and additional AI features.
