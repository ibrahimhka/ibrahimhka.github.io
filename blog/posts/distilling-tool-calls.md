---
title: "Distilling Frontier Tool-Calling Into a Local 8B"
date: "June 17, 2026"
description: "A frontier model's tool calling can be distilled into an 8 billions model that runs locally or on prem hardware using a single GPU. The untrained base reasons but does not reach for the available MCP tools and calls; the distilled student runs the full market-analyst plan"
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

*A frontier model knows how to drive an analyst's tools — pull prices, pick the right indicators, verify the numbers, then write. The behaviour is the valuable part, and behaviour moves. So I moved it into an 8B that runs free, on one GPU in the rack.*

---

While LLMs are excellent at doing many things, sometimes when desiging an agentic workflow, many of your agents can do fine with a better suited and better trained smaller language model. 
That was the hypothesis I set out to test and see if I could cut costs on parts of my inference api calls, via a locally hosted model. 

## The task

A market-analyist agent, in the style of an agentic trading harness, a ticker and a date are submitted, the model pulls the price history, selects one or more eight technical indicators from a set of 8. 
The aim is to have a deterministic verified snapshot to ground the figures it is about to cite and call. Leading to fine grained output, that is repeatable and reliable using a small language model of 8 billion parameters only.

## The move

Capture the teacher's ReAct traces, all the tools called and logged and fine-tune a **Qwen3-8B** with QLoRA on that chain set of tool calls, supervising only the assistant's tool-call turns. The whole run fits on one **RTX 4070, 12 GB** or **NVIDIA TESLA P40**: a 4-bit base with a small LoRA adapter. It ships as a GGUF, applied over the stock base in Ollama. 

## What it bought

Per single decision, scored against the teacher, the untrained base picked the right tool **49%** of the time; the distilled student, **90%**.

The screenshot shows the comparison for the same base prompt, running on:

 - Base model Qwen3-8B plain 
 - Trained model Qwen3-8B-Student
 - Teacher model - openai/openrouter API call

<img src="/assets/distill/results.png" alt="Three-column demo on one ticker: untrained baseline, distilled student, and frontier teacher running the market-analyst task" style="width:100%;border:1px solid #c8c4ba;border-radius:4px;margin:12px 0;">


> One run, ticker **AAPL**. **Baseline** — the untrained Qwen3-8B — reaches for no tools: it writes 3,800 characters of *reasoning* about which indicators it might pick, then stops, having done nothing. **Student** — the same 8B plus our LoRA — runs the full plan: `get_stock_data`, eight `get_indicators`, the verified snapshot, then a report — in ~43 seconds, at **$0**, with nothing leaving the machine. **Teacher** — the frontier model, remote — produces the same shape for a few cents. The student even takes the verified snapshot the teacher skipped.

The resuylts clearly shows that the base model, thinks and writes a 3000+ characters report. The trained model runs the agentic plan end to end, executing tool calls , structurally similar to that of the frontier, and on a good run more thorough than it, at zero cost per call(infra dependant, otherwise fractional costs). Interestingly enough, the local model wins if we are strictly measuring speed and time to execute end-to-end.

## The honest part

Claude says:"Distil the behaviour once; run it forever, on hardware you own." and I couldn't agree more. In certain cases.

While this doesn't mean that the trained model can replace any and all inference api calls for a trading harness, it does mean that certain agents in the harness can make use of such a model in their planning or via an llm model router in order to achieve similar level analysis based on an MCP toolkit backed by a backend.
The trained model is small, on the right hardware, it can be scaled to service multiple users, the pattern checks out and can be reused for different purposes or with larger models and larger data sets, although I might need vast.ai for that, or a generous H100 donor :) 

