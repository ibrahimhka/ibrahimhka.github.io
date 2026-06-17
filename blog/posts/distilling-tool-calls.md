---
title: "Distilling Frontier Tool-Calling Into a Local 8B"
date: "June 17, 2026"
description: "A frontier model knows how to drive an analyst's tools. I distilled that behaviour into an 8B that runs free on a single GPU — the untrained base does nothing, the student matches the teacher."
---

```
                                               =
                                              .+..-: .
                                              +█#++&▒░
                                             -%&██▓█@..
                                             -░&@▒▒#&&#            ..
                               .::..         +░██░░▒██▓=        .. -:. :
                             .&#%-=%&%      .▒▓██████@+▓.       +▒@*=&▒▓
                            :@*@▓▓▒░%-      =▓+██████--█-        -&▓██░+
                     .       ***███▒++      *▓:#████▓.+░=       %&&░▓░#&=
                 .   =       =▓░#&#░▓▓      *▒=.█#-█▒.:.        #█▒▓@▓█░@   = .=**
                .*  .=       ░████████=     .-.%█@-░▓%&░=      :█▓███████- -*:=##%=
                #▒*-*@%&:   =▒%█████▒%░      ::#@@&&#*.        &█+█████▒█= -#▓@#▒▓▒=
              -+▒████▓=▓-   %#*█████&-█:        .-:.           ▒# #░▓█▒&▒...:█▓███##
          :. -█▒&@▓▓#&%░-   &░.&█&▒▒ =%*                       .. @▓ #▓▓* :▒&&&#@@▒█*
          #▓*&███▓%#▒#▒█=   .. ░▓ ▓▓-.                          .:▒█=*█=  =@░▒░▒██░▒*
          #█▒█▓#████████@: .+.*█▓=%#░▒+                       .%░░%=:&█▒. #█████████+
          &████░@███████▓░  -+=-+&::..                          .:-=&%=.-:░*▓███████#
          +█████▒░█▓▓███▒*     .:.                 ..               ..-. =#=░██████▓&
          :▓████▓▓█▒████@*:                        -.        --.--=         &█▒▓██+█*
         .-░█████████▒█▓█▓█#.   . +-         ..    =:        %█▒░▓▒       :=░█▓:#█=%=
         .=&#▓██████▒▓▓▒░*-     *@&=#▒:      -▓@%=&▓░        .%██▒:     .:%+&%==▓█▒==.
 -░&-.      .-%░▒███▓#+.        :&█▒▓=        :@▓█▒%:        %@#▒@#       .-.:&%▓▓@%=.        .=&░:
  .=&░@*:       .+=-.           -@▒░#&:      #+&░▓▓%*        %████▓*         .-*-.         :*@░&=.
      :*@░&=.                  -░▓██▒█&     *█▓█░&▓▒@.       &████░█:                  .+&░@*:
         .=%░@%-.              ++▓███░*    =░=███████%       ▒%█%█**-              .-%@@%-.
             .+#▒#+.          .=-░▒&▓▒-.   ░% ▓█████*█:     .=@▓.▓&-.           .+#░#+.
                .-%@░%=.      .=%@&=:+=.  -░% @████▒=█:    .*=░▒&█▒*=       .=%░@*-
                    .=&░@*:       ..      :.. ░▓-=▒░%░:       .+*=.      :*@░&=.
                        :*@░&=.            .*#█▓░-▒█&*:              .+#░#*:
                           .-%░░%-          :+&-:+█▓=+.           -%░░%-
                               :+#░#+:          :=-.          :*#░&+.
                                   -%░░%-.                .=&░@*:
                                      .+&░@*:          -*@░&=.
                                          :*@░&=.  .+#░#+:
                                             .=&░@░@%-.
                                                 :.
```

*A frontier model knows how to drive an analyst's tools — pull prices, pick the right indicators, verify the numbers, then write. I taught an 8B to do the same, on one consumer GPU, at zero cost per call.*

---

There is a quieter way to use a large language model than renting the largest one you can find. For a narrow, repeatable, *agentic* task — the kind where the model has to decide which tools to call and in what order — you usually don't need a 500-billion-parameter frontier model living on someone else's hardware, metered by the token and rate-limited on a whim. You need the **behaviour**, and you can move the behaviour.

So I tried to move it: take a frontier model's tool-calling for a specific analyst workflow and distil it into an 8-billion-parameter model that runs, for free, on a single GPU in my rack.

## The task: an analyst that drives tools

The workflow is a market-analyst, in the style of the TradingAgents tool-calling tier. Given a ticker and a trade date, the model has to run a short plan: pull the raw price history, select **up to eight** technical indicators that complement rather than duplicate each other, take a deterministic *verified snapshot* to ground the exact numbers it is about to cite, and only then write the report.

The interesting part isn't the prose at the end — any model will happily write paragraphs. The skill is the **discipline**: which tools, which indicators, in what order, and the restraint to verify before it asserts. That discipline is exactly what a strong frontier model has and a raw open-source model does not.

## Distillation, not parroting

I didn't want the small model to memorise reports. I wanted it to learn the teacher's *policy* — the sequence of decisions. So I captured the frontier teacher's ReAct traces (the exact tool calls it makes on each turn) and fine-tuned a **Qwen3-8B** with QLoRA, supervising only the assistant's tool-call turns and leaving the rest of the conversation unmasked. The whole run fits on one **RTX 4070, 12 GB** — 4-bit base, a small LoRA adapter, a few minutes per pass. The trained adapter is about 3 GB before quantisation; it ships as a GGUF and is applied on top of the stock base inside Ollama.

## What the numbers said

On a held-out set of single decisions, scored against the teacher: the **untrained base picked the correct tool 49% of the time; the distilled student, 90%**. But the average undersells it. The more telling failure of the base wasn't picking the *wrong* tool — it was declining to use the tools at all, and writing a confident report from nothing.

## Watching it run

I built the thing I actually wanted to look at: the same task, three columns, side by side.

<img src="/assets/distill/results.png" alt="Three-column demo on one ticker: untrained baseline, distilled student, and frontier teacher running the market-analyst task" style="width:100%;border:1px solid #c8c4ba;border-radius:4px;margin:12px 0;">

> One run, ticker **AAPL**. **Baseline** (untrained Qwen3-8B) calls no tools and writes an empty report. **Student** (the same 8B plus our distilled LoRA) runs the full plan — `get_stock_data`, eight `get_indicators`, the `get_verified_market_snapshot`, then a 3,824-character report — in about 43 seconds, at **$0**, with nothing leaving the machine. **Teacher** (the frontier model, remote) produces the same shape, billed at a few cents. Note the student is, if anything, *more* thorough than the model it learned from: it takes the verified snapshot the teacher skipped.

The contrast *is* the argument. The baseline — the very same Qwen3-8B, untouched — produces an empty report and reaches for nothing. The student runs the full agentic plan, structurally indistinguishable from the teacher, and on a good run it is *more* thorough than the frontier model: it remembers to take the verified snapshot before it writes. It does all of this locally, at **zero cost per call**, with no data leaving the machine.

## The honest part

A base model's habits are stubborn. Qwen3-8B wanted to batch its eight indicators into a single call with a list argument, and to invent its own date-range parameter names. Distillation pulled it most of the way to the teacher's convention; a small serving-side normaliser handles the residue, expanding the batch into the individual calls the tools expect. The per-decision score also flatters the model slightly versus the full multi-turn loop, where small errors compound. There is another training pass queued to push the raw output cleaner. None of it changes the headline.

## Why it matters

The result I care about isn't 90% versus 49%. It's that a small adapter turns a model that *cannot drive tools* into one that runs a multi-step analyst workflow — for free, locally, privately, with no per-token bill and no rate limit. The funniest detail of the live demo is the one that makes the point best: the column that throttles and stalls is the **frontier teacher**, on its remote free tier. The small model on my desk is the reliable one.

For a growing class of narrow, repeatable agentic tasks, that trade — distil the behaviour once, run it forever on hardware you own — is only going to keep looking better.
